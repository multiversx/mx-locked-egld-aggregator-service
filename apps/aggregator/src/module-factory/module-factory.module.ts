import { Module } from '@nestjs/common';
import { ApiModuleOptions, ApiService } from "@multiversx/sdk-nestjs-http";
import { MetricsService } from "@multiversx/sdk-nestjs-monitoring";
import { ApiConfigService } from '@libs/common';
import configuration from '../../../../config/configuration';
import { ConfigService } from '@nestjs/config';
import { ElasticModuleOptions, ElasticService } from '@multiversx/sdk-nestjs-elastic';

@Module({})
export class ModuleFactory {
    static rootPath = '../providers';

    static getService(projectName: string) {

        const services = require(`${this.rootPath}/${projectName}`);
        const ServiceClass = Object.values(services)[0] as any;

        if (ServiceClass) {

            const apiModuleOptions = new ApiModuleOptions();
            const metricsService = new MetricsService();
            const apiService = new ApiService(apiModuleOptions, metricsService);
            const configService = new ConfigService(configuration());
            const apiConfigService = new ApiConfigService(configService);
            const elasticModuleOptions = new ElasticModuleOptions({
                url: apiConfigService.getElasticUrl(),
                customValuePrefix: 'api',
            });
            const elasticService = new ElasticService(elasticModuleOptions, apiService, metricsService);

            return new ServiceClass(apiConfigService, apiService, elasticService); // TODO add elastic
        }
        throw new Error(`Provider implementation not found.`);
    }
}
