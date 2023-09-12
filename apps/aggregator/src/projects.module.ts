import { Module } from '@nestjs/common';
import { DummyModule, DummyService, SalsaModule, SalsaService } from 'apps/providers';

@Module({
  imports: [
    DummyModule,
    SalsaModule,
  ],
  providers: [
    DummyService,
    SalsaService,
  ],
  exports: [
    DummyService,
    SalsaService,
  ],
})
export class ProjectsModule { }
