import { ApiConfigModule, DynamicModuleUtils } from '@libs/common';
import { Module } from '@nestjs/common';
import { ElasticIndexerService } from './elastic.indexer.service';

@Module({
  imports: [
    ApiConfigModule,
    DynamicModuleUtils.getElasticModule(),
  ],
  providers: [ElasticIndexerService],
  exports: [ElasticIndexerService],
})

export class ElasticIndexerModule {}
