import { ApiConfigService } from '@libs/common';
import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { ApiService, ApiSettings } from '@multiversx/sdk-nestjs-http';
import fs from 'fs';
import path from 'path';

@Injectable()
export class ElasticIndexerService {
  private readonly logger = new OriginLogger(ElasticIndexerService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {}

  async addLiquidStakingForAddress(address: string, epoch: number, totalLiquidStaking: BigNumber): Promise<void> {
    if (!this.apiConfigService.isElasticExportEnabled()) {
      return;
    }

    const indexName = this.getIndexName(epoch);
    if (!await this.doesIndexExist(indexName)) {
      const successful = await this.createIndexWithMapping(indexName);
      if (!successful) {
        return;
      }
    }

    await this.setLiquidStakingValues(address, epoch, totalLiquidStaking);
  }

  private async setLiquidStakingValues(address: string, epoch: number, totalLiquidStaking: BigNumber) {
    const indexName = this.getIndexName(epoch);
    //await this.apiService.post()

    const totalLiquidStakingStr = totalLiquidStaking.toString(10);
    const totalLiquidStakingNum = this.getNumericValueForBigInt(totalLiquidStaking);
    const liquidStakingFields = {
      liquidStaking: totalLiquidStakingStr,
      liquidStakingNum: totalLiquidStakingNum,
    };

    const esScript = `{"doc":${JSON.stringify(liquidStakingFields)}, "upsert": ${JSON.stringify(liquidStakingFields)}}`;
    await this.apiService.post(`${this.apiConfigService.getElasticUrl()}/${indexName}/_update/${address}`, esScript, this.getApiSettingForESQueries());

    this.logger.log(`Saved record for address ${address}. Liquid staking balance: ${totalLiquidStaking}.`);
  }

  private getIndexName(epoch: number): string {
    return `${this.apiConfigService.getElasticIndexPrefix()}_${epoch}`;
  }

  private getNumericValueForBigInt(bigNumber: BigNumber): number {
    return (parseFloat(bigNumber.dividedBy(1e18).toFixed(10)));
  }

  private async createIndexWithMapping(indexName: string): Promise<boolean> {
    const mapping = this.getIndexMapping();
    if (!mapping) {
      this.logger.error('cannot load mapping from file');
      return false;
    }

    await this.apiService.put(`${this.apiConfigService.getElasticUrl()}/${indexName}`, JSON.parse(mapping), this.getApiSettingForESQueries());
    return true;
  }

  private async doesIndexExist(indexName: string): Promise<boolean> {
    try {
      const result = await this.apiService.head(`${this.apiConfigService.getElasticUrl()}/${indexName}`);
      return result && result.status && result.status == 200;
    } catch (error) {
      return false;
    }
  }

  private getApiSettingForESQueries(): ApiSettings {
    const apiSettings = new ApiSettings();
    apiSettings.headers = { 'content-type': 'application/json' };

    return apiSettings;
  }

  private getIndexMapping(): string | undefined {
    const filePath = path.join(__dirname, './mappings/index.mapping.json');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    return undefined;
  }
}
