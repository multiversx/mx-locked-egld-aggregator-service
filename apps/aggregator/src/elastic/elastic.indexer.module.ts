import { ApiConfigModule } from '@libs/common';
import { Module } from '@nestjs/common';
import { ElasticIndexerService } from './elastic.indexer.service';
import { ApiModule } from '@multiversx/sdk-nestjs-http';

@Module({
  imports: [
    ApiConfigModule,
    ApiModule,
  ],
  providers: [ElasticIndexerService],
  exports: [ElasticIndexerService],
})

export class ElasticIndexerModule {}
