import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ModuleFactory } from './module-factory';
import { graphqlQuery } from './graphql.helper';
import { AlertsService, ApiConfigService } from '@libs/common';
import BigNumber from 'bignumber.js';
const fs = require('fs').promises;
const path = require('path');
@Injectable()
export class DataApiIndexerService {
    private readonly logger = new Logger(DataApiIndexerService.name);
    private readonly BATCH_API_REQUEST_SIZE = 10;
    private readonly API_SLEEP_TIME = 10000;
    private readonly PROVIDER_PATH = path.resolve('./providers');

    constructor(
        private readonly apiConfigService: ApiConfigService,
        private readonly alertsService: AlertsService,
    ) {
        this.indexData();
    }

    async getProviders(): Promise<string[]> {
        try {
            const files = await fs.readdir(this.PROVIDER_PATH);
            const providers = files.filter((file: any) => file.includes('.ts'))
            return providers;
        } catch (err) {
            this.logger.error(`Error while reading providers: ${err}`);
            return [];
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async indexData() {
        const providers: string[] = await this.getProviders();
        console.log(`Providers found: ${providers}`)
        const service = await ModuleFactory.getService('example');
        console.log(await service.getStakingContracts());

        for (const provider of providers) {
            try {
                const providerName = provider.split('.')[0];
                const { stakedValueSum, stakingAddresses } = await this.fetchDataForProject(providerName);
                await this.writeData(provider, 'stakedValue', stakedValueSum.toString());
                await this.writeData(provider, 'stakingUsers', stakingAddresses.length.toString());
            } catch (e) {
                await this.alertsService.sendIndexerError(`Error while indexing data for ${provider}: ${e}`);
                this.logger.error(`Error while indexing data for ${provider}: ${e}`);
            }
        }
    }

    async fetchDataForProject(project: string) {
        let stakedValueSum = new BigNumber(0);
        let batchIterations = 0;
        let stakingAddresses: string[] = [];
        const service = ModuleFactory.getService(project);
        this.logger.log(`Processing staked value for ${project}`);

        try {
            stakingAddresses = await service.getStakingAddresses();
            for (const address of stakingAddresses) {
                if (batchIterations % this.BATCH_API_REQUEST_SIZE === 0) {
                    const stakedValue = await service.getAddressStake(address);
                    stakedValueSum = stakedValueSum.plus(stakedValue?.stake || 0);
                    await new Promise(resolve => setTimeout(resolve, this.API_SLEEP_TIME));
                    console.log(`Batch ${batchIterations} executed`);
                }
                batchIterations++;
            }
        } catch (e) {
            throw new Error(`Error while processing staked value for ${project}: ${e}`);
        }
        return { stakedValueSum, stakingAddresses };
    }

    async writeData(project: string, key: string, value: string) {
        try {
            const query = graphqlQuery(project, key, value);
            const requestData = {
                "method": "POST",
                "headers": { "content-type": "application/json" },
                "body": JSON.stringify(query),
            };

            const apiResponse = await fetch(`${this.apiConfigService.getDataApiUrl()}/graphql`, requestData);
            const { data: ingestDataResult } = await apiResponse.json();
            if (ingestDataResult) {
                this.logger.log(`Successfully wrote ${key}: ${value} for ${project}`);
            } else {
                this.logger.error(`Error while writing data for ${project}`);
            }
        } catch (e) {
            this.logger.error(`Error while writing data for ${project}: ${e}`);
        }
    }
}
