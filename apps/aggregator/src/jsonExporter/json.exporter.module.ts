import { ApiConfigModule } from '@libs/common';
import { Module } from '@nestjs/common';
import { JsonExporterService } from './json.exporter.service';

@Module({
  imports: [
    ApiConfigModule,
  ],
  providers: [JsonExporterService],
  exports: [JsonExporterService],
})

export class JsonExporterModule {}
