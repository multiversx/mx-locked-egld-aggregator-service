import { Injectable } from '@nestjs/common';
import { AlertsService, ApiConfigService } from '@libs/common';
import BigNumber from 'bignumber.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BaseProvider } from '../../../providers/base.provider';
import { loadProvider } from '../../../common/provider.loader';
import { Lock, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { ElasticIndexerService } from './elastic/elastic.indexer.service';

@Injectable()
export class SnapshotsService {
  private readonly logger = new OriginLogger(SnapshotsService.name);
  private readonly BATCH_API_REQUEST_SIZE = 10;
  private readonly API_SLEEP_TIME = 1000;

  constructor(
    private readonly baseProvider: BaseProvider,
    private readonly apiConfigService: ApiConfigService,
    private readonly alertsService: AlertsService,
    private readonly elasticIndexer: ElasticIndexerService,
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
    for (const provider of snapshotsProviders) {
      this.logger.log(`Started processing liquid staking for provider '${provider}'`);
      try {
        const { stakedValueSum } = await this.fetchDataForProject(provider, network, liquidStakingUsers);
        this.logger.log(`Total liquid staking for provider: ${provider}: ${stakedValueSum.dividedBy(1e18)} EGLD`);
      } catch (e) {
        await this.alertsService.sendIndexerError(`Error while indexing data for ${provider}: ${e}`);
        this.logger.error(`Error while indexing data for ${provider}: ${e}`);
      }
    }

    await this.addRecordsToIndexer(liquidStakingUsers);
  }

  async addRecordsToIndexer(users: Record<string, BigNumber>) {
    const currentEpoch = await this.getCurrentEpoch();
    this.logger.log(`fetched current epoch from netowrk: ${currentEpoch}`);
    for (const address in users) {
      const addressBalance = users[address];
      await this.elasticIndexer.addLiquidStakingForAddress(address, currentEpoch, addressBalance);
    }
  }

  async getCurrentEpoch(): Promise<number> {
    let currentTry = 0;
    while (currentTry < 10) {
      const epochResponse = await this.baseProvider.getApiService().get(`${this.baseProvider.getApiConfigService().getApiUrl()}/stats`);
      if (epochResponse?.data?.epoch) {
        return epochResponse.data.epoch;
      }

      currentTry++;
      this.logger.log(`not able to fetch the current network epoch. try #${currentTry}`);
      await new Promise(resolve => setTimeout(resolve, this.API_SLEEP_TIME));
    }

    throw new Error(`cannot get current network epoch`);
  }

  async fetchDataForProject(providerName: string, network: string, users: Record<string, BigNumber>) {
    let projectStakedSum = new BigNumber(0);
    let batchIterations = 0;
    let stakingAddresses: string[] = [];
    const liquidStakingProvider = await loadProvider(this.baseProvider, network, providerName);
    this.logger.log(`Processing staked value for ${providerName}`);

    try {
      stakingAddresses = await liquidStakingProvider.getStakingAddresses();
      for (const address of stakingAddresses) {
        if (batchIterations % this.BATCH_API_REQUEST_SIZE === 0) {
          const stakedValue = await liquidStakingProvider.getAddressStake(address);
          const userStaked = new BigNumber(stakedValue?.stake || 0);
          this.addUserFunds(users, address, userStaked);
          projectStakedSum = projectStakedSum.plus(userStaked);
          await new Promise(resolve => setTimeout(resolve, this.API_SLEEP_TIME));
        }
        batchIterations++;
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
}
