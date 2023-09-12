import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { ApiConfigModule } from '../api-config/api.config.module';
import { ApiModule } from '@multiversx/sdk-nestjs-http';

@Module({
  imports: [ApiConfigModule, ApiModule],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
