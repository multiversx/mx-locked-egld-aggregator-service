import { Module } from '@nestjs/common';
import { SalsaService } from "./salsa.service";

@Module({
    imports: [],
    providers: [SalsaService],
    exports: [SalsaService],
})
export class SalsaModule { }
