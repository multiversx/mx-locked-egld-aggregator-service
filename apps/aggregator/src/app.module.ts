
import { Module } from '@nestjs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { AlertsModule, ApiConfigModule, ApiMetricsModule, DynamicModuleUtils, HealthCheckModule } from '@libs/common';
import { SnapshotsService } from './snapshots.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BaseProvider } from '../../../providers/base.provider';

@Module({
  imports: [
    LoggingModule,
    ScheduleModule.forRoot(),
    AlertsModule,
    ApiConfigModule,
    DynamicModuleUtils.getApiModule(),
    HealthCheckModule,
    ApiMetricsModule,
  ],
  providers: [
   SnapshotsService,
   BaseProvider,
  ],
})
export class AppModule { }
