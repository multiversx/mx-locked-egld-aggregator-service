import { LiquidStakingProviderInterface } from '@libs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DummyService implements LiquidStakingProviderInterface {
    constructor() { }
    public getAddressStake(_address: string): Promise<{ stake: string }> {
        return Promise.resolve({ stake: "" });
    }

    public getStakingAddresses(): Promise<string[]> {
        return Promise.resolve([
            'erd1qqqqqqqqqqqqqpgqqgxy40dn5tx2dtg0z4jt0sl0zpqm0sca398sv4d50e',
        ]);
    }

    public getStakingContracts(): Promise<string[]> {
        return Promise.resolve([
            'erd1qqqqqqqqqqqqqpgqqgxy40dn5tx2dtg0z4jt0sl0zpqm0sca398sv4d50e',
        ]);
    }

}
