
import { Module } from '@nestjs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { ApiConfigModule, ApiMetricsModule, DynamicModuleUtils, HealthCheckModule } from '@libs/common';
import { ProjectsModule } from '../../projects';
import { ModuleFactory } from "./module-factory";
import { DataApiIndexerService } from './data-api.indexer.service';
// import { DataApiWritesService } from './data-api.writes.service';

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
  providers: [
    DataApiIndexerService
  ]
})
export class AppModule { }
