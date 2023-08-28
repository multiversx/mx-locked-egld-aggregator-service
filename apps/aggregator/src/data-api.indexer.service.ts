import { Injectable, Logger } from '@nestjs/common';
import { AvailableProjects } from '.';
import { AlertsService, ApiConfigService } from '@libs/common';
import { ModuleFactory } from './module-factory';
import BigNumber from 'bignumber.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { graphqlQuery } from './graphql.helper';
@Injectable()
export class DataApiIndexerService {
    private readonly logger = new Logger(DataApiIndexerService.name);
    private readonly BATCH_API_REQUEST_SIZE = 10;
    private readonly API_SLEEP_TIME = 10000;

    constructor(
        private readonly apiConfigService: ApiConfigService,
        private readonly alertsService: AlertsService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async indexData() {
        const availableProjects = Object.values(AvailableProjects).filter((key) => key !== AvailableProjects.Dummy);

        for (const project of availableProjects) {
            try {
                const { stakedValueSum, stakingAddresses } = await this.fetchDataForProject(project);
                await this.writeData(project, 'stakedValue', stakedValueSum.toString());
                await this.writeData(project, 'stakingUsers', stakingAddresses.length.toString());
            } catch (e) {
                await this.alertsService.sendIndexerError(`Error while indexing data for ${project}: ${e}`);
                this.logger.error(`Error while indexing data for ${project}: ${e}`);
            }
        }
    }

    async fetchDataForProject(project: AvailableProjects) {
        let stakedValueSum = new BigNumber(0);
        let batchIterations = 0;
        let stakingAddresses: string[] = [];
        const service = ModuleFactory.getService(project as AvailableProjects);
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

    async writeData(project: AvailableProjects, key: string, value: string) {
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
