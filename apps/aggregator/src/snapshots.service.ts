import { Injectable } from '@nestjs/common';
import { AlertsService, ApiConfigService, LockedEgldProvider } from '@libs/common';
import BigNumber from 'bignumber.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BaseProvider } from '../../../providers/base.provider';
import { loadProvider } from '../../../common/provider.loader';
import { Lock, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { ElasticIndexerService } from './elastic/elastic.indexer.service';
import { JsonExporterService } from './jsonExporter/json.exporter.service';
import { ApiService } from '@multiversx/sdk-nestjs-http';

@Injectable()
export class SnapshotsService {
  private readonly logger = new OriginLogger(SnapshotsService.name);
  private readonly API_SLEEP_TIME = 100;

  constructor(
    private readonly baseProvider: BaseProvider,
    private readonly apiService: ApiService,
    private readonly apiConfigService: ApiConfigService,
    private readonly alertsService: AlertsService,
    private readonly elasticIndexer: ElasticIndexerService,
    private readonly jsonExporter: JsonExporterService,
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  @Lock({ name: 'Liquid Staking snapshots cronjob', verbose: true })
  async indexData() {
    const snapshotsProviders = this.apiConfigService.getSnapshotsProviders();
    if (snapshotsProviders.length == 0) {
      this.logger.warn('No provider defined in the configuration file');
      return;
    }

    const liquidStakingUsers: Record<string, BigNumber> = {};

    const network = this.apiConfigService.getNetwork();
    for (const providerName of snapshotsProviders) {
      const providerUsers: Record<string, BigNumber> = {};
      const stakedValueSum: BigNumber = new BigNumber(0);
      const providerInstance = await loadProvider(this.baseProvider, network, providerName);
      if (!providerInstance) {
        this.logger.error(`Cannot load scenario with name ${providerName}`);
      }
      this.logger.log(`Started processing liquid staking for provider '${providerName}'`);
      try {
        const { stakedValueSum } = await this.fetchDataForProject(providerInstance, providerName, providerUsers);
        this.logger.log(`Total liquid staking for provider: ${providerName}: ${stakedValueSum.dividedBy(1e18)} EGLD`);
      } catch (e) {
        await this.alertsService.sendIndexerError(`Error while indexing data for ${providerName}: ${e}`);
        this.logger.error(`Error while indexing data for ${providerName}: ${e}`);
        continue;
      }


      if (await this.isSumOfStakedLessOrEgualToContractStake(providerName, stakedValueSum, await providerInstance.getStakingContracts())) {
        this.addProviderRecordsToSum(providerUsers, liquidStakingUsers);
      } else {
        this.logger.error(`Liquid Staking provider sum of users stake is larger than the staking contracts stake. Provider=${providerName}, Sum=${stakedValueSum.toString(10)}`);
      }
    }

    this.jsonExporter.exportJson(liquidStakingUsers);
    await this.addRecordsToIndexer(liquidStakingUsers);
  }

  async addRecordsToIndexer(users: Record<string, BigNumber>) {
    const currentEpoch = await this.getCurrentEpoch();
    this.logger.log(`Fetched current epoch from network: ${currentEpoch}`);
    for (const address in users) {
      const addressBalance = users[address];
      await this.elasticIndexer.addLiquidStakingForAddress(address, currentEpoch, addressBalance);
    }
  }

  async getCurrentEpoch(): Promise<number> {
    let currentTry = 0;
    while (currentTry < 10) {
      const epochResponse = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/stats`);
      if (epochResponse?.data?.epoch) {
        return epochResponse.data.epoch;
      }

      currentTry++;
      this.logger.log(`not able to fetch the current network epoch. try #${currentTry}`);
      await new Promise(resolve => setTimeout(resolve, this.API_SLEEP_TIME));
    }

    throw new Error(`cannot get current network epoch`);
  }

  async fetchDataForProject(liquidStakingProvider: LockedEgldProvider, providerName: string, users: Record<string, BigNumber>) {
    let projectStakedSum = new BigNumber(0);
    let stakingAddresses: string[] = [];
    this.logger.log(`Processing staked value for ${providerName}`);

    try {
      stakingAddresses = await liquidStakingProvider.getStakingAddresses();
      for (const address of stakingAddresses) {
        const stakedValue = await liquidStakingProvider.getAddressStake(address);
        const userStaked = new BigNumber(stakedValue?.stake || 0);
        this.addUserFunds(users, address, userStaked);
        projectStakedSum = projectStakedSum.plus(userStaked);
        await new Promise(resolve => setTimeout(resolve, this.API_SLEEP_TIME));
      }
    } catch (e) {
      throw new Error(`Error while processing staked value for ${providerName}: ${e}`);
    }
    return { stakedValueSum: projectStakedSum };
  }

  private addUserFunds(users: Record<string, BigNumber>, address: string, balance: BigNumber) {
    const existingUserBalance = users[address];
    if (!existingUserBalance) {
      users[address] = balance;
      return;
    }

    users[address] = existingUserBalance.plus(balance);
  }

  private addProviderRecordsToSum(providerRecords: Record<string, BigNumber>, sumRecords: Record<string, BigNumber>) {
    for (const address in providerRecords) {
      if (sumRecords[address]) {
        sumRecords[address].plus(providerRecords[address]);
      } else {
        sumRecords[address] = providerRecords[address];
      }
    }
  }

  private async isSumOfStakedLessOrEgualToContractStake(providerName: string, sum: BigNumber, contracts: string[]): Promise<boolean> {
    const allContractsSum = new BigNumber(0);
    for (const contract of contracts) {
      const contractStake = await this.getStakeOfContract(contract);
      if (contractStake) {
        allContractsSum.plus(contractStake);
      }
    }

    this.logger.log(`Provider ${providerName}: users stake: ${sum}, contracts stake: ${allContractsSum}`);
    return sum.isLessThanOrEqualTo(allContractsSum);
  }

  private async getStakeOfContract(contract: string): Promise<BigNumber | undefined> {
    let contractSum = new BigNumber(0);
    try {
      const { data: contractData } = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/accounts/${contract}/delegation`);
      contractSum = contractData.reduce((acc: BigNumber, curr: any) => {
        return acc.plus(curr.userActiveStake);
      }, contractSum);
    } catch (e) {
      this.logger.log(`Error when fetching total stake of the contract ${contract}: ${e}`);
      return;
    }

    return contractSum;
  }
}
