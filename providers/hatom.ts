import { Injectable } from '@nestjs/common';
import { LockedEgldProvider } from '@libs/common';
import BigNumber from 'bignumber.js';

@Injectable()
export class HatomProvider extends LockedEgldProvider {
  private readonly tokenIdentifier = 'SEGLD-3ad2d0';
  private readonly contracts = [
    'erd1qqqqqqqqqqqqqpgq4gzfcw7kmkjy8zsf04ce6dl0auhtzjx078sslvrf4e',
  ];

  init(): Promise<void> {
    return Promise.resolve();
  }

  getLockedEgldContracts(): Promise<string[]> {
    // Return hardcoded contracts. A provider also can return the contracts from an API.
    return Promise.resolve(this.contracts);
  }

  async getAddressLockedEgld(address: string): Promise<{ lockedEgld: string }> {
    const tokenBalance = await this.baseProvider.getTokenBalance(address, this.tokenIdentifier);
    const tokenPrice = 1; // TODO get SEGLD-3ad2d0 price in EGLD

    const addressStake = new BigNumber(tokenBalance).multipliedBy(tokenPrice).toFixed();

    return {
      lockedEgld: addressStake,
    };
  }

  async getLockedEgldAddresses(): Promise<string[]> {
    return await this.baseProvider.getTokenHolders(this.tokenIdentifier);
  }
}
