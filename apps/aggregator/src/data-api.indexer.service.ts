import { Injectable, Logger } from '@nestjs/common';
import { AvailableProjects } from '.';
import { ModuleFactory } from './module-factory';
import BigNumber from 'bignumber.js';
import { ApiService } from '@multiversx/sdk-nestjs-http';

@Injectable()
export class DataApiIndexerService {
    private readonly logger = new Logger(DataApiIndexerService.name);
    constructor(
        private readonly apiService: ApiService
    ) {
        this.writeData();
    }

    async writeData() {
        const availableProjects = Object.values(AvailableProjects).filter((key) => key !== AvailableProjects.Dummy);
        let stakedValueSum = new BigNumber(0);

        for (const project of availableProjects) {
            const service = ModuleFactory.getService(project as AvailableProjects);
            try {
                const stakingAddresses = await service.getStakingAddresses();
                for (const address of stakingAddresses) {
                    const stakedValue = await service.getAddressStake(address);
                    stakedValueSum = stakedValueSum.plus(stakedValue?.stake || 0);
                }
            } catch (e) {
                throw new Error(`Error while processing staked value for ${project}: ${e}`);
            }

            try {
                await this.apiService.post('', undefined);
            } catch (e) {
                this.logger.error(`Error while writing staked value for ${project}: ${e}`);
            }

            this.logger.log(`Available projects: ${availableProjects}`);
        }
    }