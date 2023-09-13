import { LiquidStakingProviderInterface } from '@libs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DummyProvider implements LiquidStakingProviderInterface {
    constructor() { }
    public getAddressStake(_address: string): Promise<{ stake: string }> {
        return Promise.resolve({ stake: "0" });
    }

    public getStakingAddresses(): Promise<string[]> {
        return Promise.resolve(['erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th']);
    }

    public getStakingContracts(): Promise<string[]> {
        return Promise.resolve(['erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th']);
    }
}
