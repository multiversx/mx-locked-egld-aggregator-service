import { Injectable } from '@nestjs/common';
import { AlertsService, ApiConfigService } from '@libs/common';
import BigNumber from 'bignumber.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BaseProvider } from '../../../providers/base.provider';
import { loadProvider } from '../../../common/provider.loader';
import { Lock, OriginLogger } from '@multiversx/sdk-nestjs-common';

@Injectable()
export class SnapshotsService {
  private readonly logger = new OriginLogger(SnapshotsService.name);
  private readonly BATCH_API_REQUEST_SIZE = 10;
  private readonly API_SLEEP_TIME = 1000;

  constructor(
    private readonly baseProvider: BaseProvider,
    private readonly apiConfigService: ApiConfigService,
    private readonly alertsService: AlertsService,
  ) { }

  @Cron(CronExpression.EVERY_10_SECONDS)
  @Lock({ name: 'Liquid Staking snapshots', verbose: true })
  async indexData() {
    const snapshotsProviders = this.apiConfigService.getSnapshotsProviders();
    if (snapshotsProviders.length == 0) {
      this.logger.warn('No provider defined in the configuration file');
      return;
    } else {
      console.log(snapshotsProviders);
    }
    // const snapshotsProviders = Object.values(AvailableProjects).filter((key) => key !== AvailableProjects.Dummy);

    const network = this.apiConfigService.getNetwork();
    for (const provider of snapshotsProviders) {
      try {
        const { stakedValueSum, stakingAddresses } = await this.fetchDataForProject(provider, network);
        await this.writeData(provider, network, 'stakedValue', stakedValueSum.toString());
        await this.writeData(provider, network, 'stakingUsers', stakingAddresses.length.toString());
      } catch (e) {
        await this.alertsService.sendIndexerError(`Error while indexing data for ${provider}: ${e}`);
        this.logger.error(`Error while indexing data for ${provider}: ${e}`);
      }
    }
  }

  async fetchDataForProject(providerName: string, network: string) {
    let stakedValueSum = new BigNumber(0);
    let batchIterations = 0;
    let stakingAddresses: string[] = [];
    const liquidStakingProvider = await loadProvider(this.baseProvider, network, providerName);
    this.logger.log(`Processing staked value for ${providerName}`);

    try {
      stakingAddresses = await liquidStakingProvider.getStakingAddresses();
      for (const address of stakingAddresses) {
        if (batchIterations % this.BATCH_API_REQUEST_SIZE === 0) {
          const stakedValue = await liquidStakingProvider.getAddressStake(address);
          stakedValueSum = stakedValueSum.plus(stakedValue?.stake || 0);
          await new Promise(resolve => setTimeout(resolve, this.API_SLEEP_TIME));
          console.log(`Batch ${batchIterations} executed`);
        }
        batchIterations++;
      }
    } catch (e) {
      throw new Error(`Error while processing staked value for ${providerName}: ${e}`);
    }
    console.log(`Finished processing the values for ${providerName}`);
    return { stakedValueSum, stakingAddresses };
  }

  async writeData(providerName: string, network: string, key: string, value: string) {
    // TODO: write data into ES
    console.log(`saving data [key=${key}, value=${value}] for provider ${providerName} and network ${network}`);
    await Promise.resolve();

  }
}
