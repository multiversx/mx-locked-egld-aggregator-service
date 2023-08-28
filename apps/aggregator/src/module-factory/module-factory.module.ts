import { Module } from '@nestjs/common';
import { ProjectsInterface } from "../../../projects";
import { AvailableProjects } from "../../../projects";
import { ApiModuleOptions, ApiService } from "@multiversx/sdk-nestjs-http";
import { MetricsService } from "@multiversx/sdk-nestjs-monitoring";
import { ApiConfigService } from '@libs/common';
import configuration from '../../../../config/configuration';
import { ConfigService } from '@nestjs/config';
@Module({})
export class ModuleFactory {
    static rootPath = '../../../projects';
    static getService(projectName: AvailableProjects): ProjectsInterface {
        if (!projectName) throw new Error(`Project name is required.`);
        if (!Object.values(AvailableProjects).includes(projectName)) throw new Error(`Project ${projectName} not found, check that projectName is added in AvailableProjects.`);
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
