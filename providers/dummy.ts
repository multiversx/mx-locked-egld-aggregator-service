import { LockedEgldProvider } from '@libs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DummyProvider extends LockedEgldProvider {
  init(): Promise<void> {
    return Promise.resolve();
  }

  public getAddressLockedEgld(_address: string): Promise<{ lockedEgld: string }> {
    return Promise.resolve({ lockedEgld: '0' });
  }

  public getLockedEgldAddresses(): Promise<string[]> {
    return Promise.resolve(['erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th']);
  }

  public getLockedEgldContracts(): Promise<string[]> {
    return Promise.resolve(['erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th']);
  }
}
