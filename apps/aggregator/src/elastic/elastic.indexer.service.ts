import { ApiConfigService } from '@libs/common';
import { ElasticService } from '@multiversx/sdk-nestjs-elastic';
import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

@Injectable()
export class ElasticIndexerService {
  private readonly logger = new OriginLogger(ElasticIndexerService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
  ) {}

  async addLiquidStakingForAddress(address: string, epoch: number, totalLiquidStaking: BigNumber): Promise<void> {
    const currentTotalBalance = await this.getTotalBalanceWithStake(address, epoch);
    if (currentTotalBalance.length == 0) {
      this.logger.warn(`No entry for address ${address} found in Elasticsearch`);
      return;
    }

    await this.setLiquidStakingValues(address, epoch, totalLiquidStaking, currentTotalBalance);
  }

  private async getTotalBalanceWithStake(address: string, epoch: number): Promise<string> {
    const result = await this.elasticService.get(`${this.apiConfigService.getElasticUrl()}/${this.getIndexName(epoch)}/_search?q=_id:${address}`);
    const hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      const totalBalanceWithStake = hits[0]._source.totalBalanceWithStake;
      return totalBalanceWithStake == '' ? '0' : totalBalanceWithStake;
    }

    return '';
  }

  private async setLiquidStakingValues(address: string, epoch: number, totalLiquidStaking: BigNumber, currentTotalBalance: string) {
    let totalBalance = new BigNumber(currentTotalBalance);
    totalBalance = totalBalance.plus(totalLiquidStaking);

    const indexName = this.getIndexName(epoch);
    await this.elasticService.setCustomValue(`${indexName}`, address, 'totalBalanceWithStake', totalBalance.toString(10));
    await this.elasticService.setCustomValue(`${indexName}`, address, 'liquidStaking', totalLiquidStaking.toString(10));

    await this.elasticService.setCustomValue(`${indexName}`, address, 'totalBalanceWithStakeNum', this.getNumericValueForBigInt(totalBalance));
    await this.elasticService.setCustomValue(`${indexName}`, address, 'liquidStakingNum', this.getNumericValueForBigInt(totalLiquidStaking));

    this.logger.log(`Saved record for address ${address}. Liquid staking balance: ${totalLiquidStaking}. Final balance: ${totalBalance}`);
  }

  private getIndexName(epoch: number): string {
    return `${this.apiConfigService.getElasticIndexPrefix()}_${epoch}`;
  }

  private getNumericValueForBigInt(bigNumber: BigNumber): number {
    return (parseFloat(bigNumber.dividedBy(1e18).toFixed(10)));
  }
}
