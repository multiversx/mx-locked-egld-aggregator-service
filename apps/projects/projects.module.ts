import { Module } from '@nestjs/common';
import { DummyModule, DummyService } from './dummy';
import { SalsaModule, SalsaService } from "./salsa";

@Module({
  imports: [
    DummyModule,
    SalsaModule,
  ],
  exports: [
    DummyService,
    SalsaService,
  ],
})
export class ProjectsModule { }
