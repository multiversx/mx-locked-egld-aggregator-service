
import { Module } from '@nestjs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { AlertsModule, ApiConfigModule, ApiMetricsModule, DynamicModuleUtils, HealthCheckModule } from '@libs/common';
import { ModuleFactory } from "./module-factory";
import { DataApiIndexerService } from './data-api.indexer.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ProjectsModule } from './projects.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LoggingModule,
    AlertsModule,
    ApiConfigModule,
    DynamicModuleUtils.getApiModule(),
    HealthCheckModule,
    ApiMetricsModule,
    ProjectsModule,
    ModuleFactory,
  ],
  providers: [
    DataApiIndexerService,
  ],
})
export class AppModule { }
