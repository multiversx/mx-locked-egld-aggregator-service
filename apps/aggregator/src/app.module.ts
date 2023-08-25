
import { Module } from '@nestjs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { ApiConfigModule, ApiMetricsModule, DynamicModuleUtils, HealthCheckModule } from '@libs/common';
import { ProjectsModule } from '../../projects';
import { ModuleFactory } from "./module-factory";

@Module({
  imports: [
    LoggingModule,
    ApiConfigModule,
    DynamicModuleUtils.getApiModule(),
    HealthCheckModule,
    ApiMetricsModule,
    ProjectsModule,
    ModuleFactory,
  ],
})
export class AppModule { }
