import { ApiConfigModule, DynamicModuleUtils } from '@libs/common';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ApiConfigModule,
    DynamicModuleUtils.getApiModule(),
  ],
  providers: [
  ],
  exports: [
  ],
})
export class ProjectsModule { }
