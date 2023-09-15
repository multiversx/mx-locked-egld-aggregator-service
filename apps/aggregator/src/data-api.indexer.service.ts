import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ModuleFactory } from './module-factory';
const fs = require('fs').promises;
const path = require('path');
@Injectable()
export class DataApiIndexerService {
    // private readonly logger = new Logger(DataApiIndexerService.name);
    // private readonly BATCH_API_REQUEST_SIZE = 10;
    // private readonly API_SLEEP_TIME = 10000;
    private readonly FOLDER_PATH = path.resolve('./providers');
    private SERVICES: any[] = [];

    constructor(
        // private readonly apiConfigService: ApiConfigService,
        // private readonly alertsService: AlertsService,
    ) {
        this.indexData();
    }

    async getFiles() {
        try {
            console.log(`Reading files from folder: ${this.FOLDER_PATH}`);
            const files = await fs.readdir(this.FOLDER_PATH);
            files.forEach((file: any) => {
                if (file.includes('.js') && !file.includes('.map')) {
                    this.SERVICES.push(file);
                }
            });
        } catch (err) {
            console.error('An error occurred:', err);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async indexData() {
        // const availableProjects = Object.values(AvailableProjects).filter((key) => key !== AvailableProjects.Dummy);

        await this.getFiles();
        // const files = this.SERVICES;
        // files.forEach(async (file: any) => {

        const service = await ModuleFactory.getService('dummy');
        console.log(await service.getStakingAddresses());

        // const apiConfigApp = await NestFactory.create({
        //     imports: [
        //         ApiConfigModule,
        //         DynamicModuleUtils.getApiModule(),
        //         DynamicModuleUtils.getElasticModule(),
        //     ],
        //     providers: [
        //         {
        //             provide: 'LIQUID_STAKING_SERVICE_PROVIDER',
        //             useClass: eval(serviceClass),
        //         },
        //     ],
        // });

        // console.log(`apiConfigApp: ${apiConfigApp}`);

    }

    //     for (const project of availableProjects) {
    //         try {
    //             const { stakedValueSum, stakingAddresses } = await this.fetchDataForProject(project);
    //             await this.writeData(project, 'stakedValue', stakedValueSum.toString());
    //             await this.writeData(project, 'stakingUsers', stakingAddresses.length.toString());
    //         } catch (e) {
    //             await this.alertsService.sendIndexerError(`Error while indexing data for ${project}: ${e}`);
    //             this.logger.error(`Error while indexing data for ${project}: ${e}`);
    //         }
    //     }
    // }

    // async fetchDataForProject(project: AvailableProjects) {
    //     let stakedValueSum = new BigNumber(0);
    //     let batchIterations = 0;
    //     let stakingAddresses: string[] = [];
    //     const service = ModuleFactory.getService(project as AvailableProjects);
    //     this.logger.log(`Processing staked value for ${project}`);

    //     try {
    //         stakingAddresses = await service.getStakingAddresses();
    //         for (const address of stakingAddresses) {
    //             if (batchIterations % this.BATCH_API_REQUEST_SIZE === 0) {
    //                 const stakedValue = await service.getAddressStake(address);
    //                 stakedValueSum = stakedValueSum.plus(stakedValue?.stake || 0);
    //                 await new Promise(resolve => setTimeout(resolve, this.API_SLEEP_TIME));
    //                 console.log(`Batch ${batchIterations} executed`);
    //             }
    //             batchIterations++;
    //         }
    //     } catch (e) {
    //         throw new Error(`Error while processing staked value for ${project}: ${e}`);
    //     }
    //     return { stakedValueSum, stakingAddresses };
    // }

    // async writeData(project: AvailableProjects, key: string, value: string) {
    //     try {
    //         const query = graphqlQuery(project, key, value);
    //         const requestData = {
    //             "method": "POST",
    //             "headers": { "content-type": "application/json" },
    //             "body": JSON.stringify(query),
    //         };

    //         const apiResponse = await fetch(`${this.apiConfigService.getDataApiUrl()}/graphql`, requestData);
    //         const { data: ingestDataResult } = await apiResponse.json();
    //         if (ingestDataResult) {
    //             this.logger.log(`Successfully wrote ${key}: ${value} for ${project}`);
    //         } else {
    //             this.logger.error(`Error while writing data for ${project}`);
    //         }
    //     } catch (e) {
    //         this.logger.error(`Error while writing data for ${project}: ${e}`);
    //     }
    // }
}
