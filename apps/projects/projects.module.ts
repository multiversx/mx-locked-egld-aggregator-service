import { Module } from '@nestjs/common';
import { DummyModule, DummyService } from './dummy';
import { SalsaModule, SalsaService } from "./salsa";

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
