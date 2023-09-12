import { Module } from '@nestjs/common';
import { ApiModuleOptions, ApiService } from "@multiversx/sdk-nestjs-http";
import { MetricsService } from "@multiversx/sdk-nestjs-monitoring";
import { ApiConfigService } from '@libs/common';
import configuration from '../../../../config/configuration';
import { ConfigService } from '@nestjs/config';
import { LiquidStakingProviders } from '../../../providers';

@Module({})
export class ModuleFactory {
    static rootPath = '../../../providers';

    static getService(projectName: LiquidStakingProviders): LiquidStakingProviders {
        if (!Object.values(LiquidStakingProviders).includes(projectName)) {
            throw new Error(`Provider ${projectName} was not found, check that your provider is added in the LiquidStakingProviders enum.`);
        }

        const serviceName = `${projectName.charAt(0).toUpperCase() + projectName.slice(1)}Service`;
        const services = require(`${this.rootPath}/${projectName}/${projectName}.service`);

        if (services && services[`${serviceName}`]) {
            const ServiceClass = services[`${serviceName}`];
            const apiModuleOptions = new ApiModuleOptions();
            const metricsService = new MetricsService();
            const apiService = new ApiService(apiModuleOptions, metricsService);
            const configService = new ConfigService(configuration());
            const apiConfigService = new ApiConfigService(configService);
            return new ServiceClass(apiService, apiConfigService);
        }
        throw new Error(`Service ${serviceName} not found.`);
    }
}
