import { Injectable } from '@nestjs/common';
import { LockedEgldProvider } from '@libs/common';
import { BigNumber } from 'bignumber.js';

@Injectable()
export class ExampleProvider extends LockedEgldProvider {
  private readonly tokenIdentifier = 'LEGLD-d74da9';
  private readonly contracts = [
    'erd1qqqqqqqqqqqqqpgqaqxztq0y764dnet95jwtse5u5zkg92sfacts6h9su3',
  ];

  init(): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line require-await
  async getStakingContracts(): Promise<string[]> {
    // Return hardcoded contracts. A provider also can return the contracts from an API.
    return this.contracts;
  }

  async getAddressStake(address: string): Promise<{ stake: string }> {
    const tokenBalance = await this.baseProvider.getTokenBalance(address, this.tokenIdentifier);
    const tokenPrice = 1; // TODO get LEGLD-d74da9 price in EGLD

    const addressStake = new BigNumber(tokenBalance).multipliedBy(tokenPrice).toFixed();

    return {
      stake: addressStake,
    };
  }

  async getStakingAddresses(): Promise<string[]> {
    const holders = await this.baseProvider.getTokenHolders(this.tokenIdentifier);

    return holders;
  }
}
