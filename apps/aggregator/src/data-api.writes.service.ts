import { Injectable, Logger } from '@nestjs/common';
import { AvailableProjects } from '.';
import { ModuleFactory } from './module-factory';

@Injectable()
export class DataApiWritesService {
    private readonly logger = new Logger(DataApiWritesService.name);
    constructor() {
        this.writeData();
    }

    async writeData(){
        const availableProjects = Object.values(AvailableProjects)
        .filter((key) => key !== AvailableProjects.Dummy);

        for(const project of availableProjects){
            const service = ModuleFactory.getService(project as AvailableProjects);
            const stakingAddresses = await service.getStakingAddresses();
            this.logger.log(`Staking addresses for ${project}: ${stakingAddresses}`);
        }
    
        this.logger.log(`Available projects: ${availableProjects}`);
    }
}