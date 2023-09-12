import { Module } from '@nestjs/common';
import { ApiModuleOptions, ApiService } from "@multiversx/sdk-nestjs-http";
import { MetricsService } from "@multiversx/sdk-nestjs-monitoring";
import { ApiConfigModule, ApiConfigService, DynamicModuleUtils } from '@libs/common';
import configuration from '../../../../config/configuration';
import { ConfigService } from '@nestjs/config';
import { LiquidStakingProviders } from '../../../providers';
import { NestFactory } from '@nestjs/core';
import { ElasticService } from '@multiversx/sdk-nestjs-elastic';

@Module({})
export class ModuleFactory {
    static rootPath = '../../../providers';

    static async getService(projectName: LiquidStakingProviders): Promise<LiquidStakingProviders> {
        if (!Object.values(LiquidStakingProviders).includes(projectName)) {
            throw new Error(`Provider ${projectName} was not found, check that your provider is added in the LiquidStakingProviders enum.`);
        }

        const services = require(`${this.rootPath}/${projectName}`);
        const ServiceClass = Object.values(services)[0] as any;

        if (ServiceClass) {
            const app = await NestFactory.create({
                imports: [
                    ApiConfigModule,
                    DynamicModuleUtils.getElasticModule(),
                ],
            });
            const apiModuleOptions = new ApiModuleOptions();
            const metricsService = new MetricsService();
            const apiService = new ApiService(apiModuleOptions, metricsService);
            const configService = new ConfigService(configuration());
            const apiConfigService = new ApiConfigService(configService);
            const elasticService = app.get<ElasticService>(ElasticService);
            return new ServiceClass(apiConfigService, apiService, elasticService); // TODO add elastic
        }
        throw new Error(`Provider implementation not found.`);
    }
}
