import { Injectable } from '@nestjs/common';
import { LockedEgldProvider } from '@libs/common';
import { BigNumber } from 'bignumber.js';
import axios from 'axios';

@Injectable()
export class DemiourgosProvider extends LockedEgldProvider {
  private readonly tokenIdentifier = 'VEGLD-2b9319';
  private readonly contracts = [
    'erd1qqqqqqqqqqqqqpgqawus4zu5w2frmhh9rscjqnu9x6msfjya2d2sfw7tsn',
  ];

  init(): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line require-await
  async getLockedEgldContracts(): Promise<string[]> {
    return Promise.resolve(this.contracts);
  }

  async getAddressLockedEgld(address: string): Promise<{ lockedEgld: string }> {
    const tokenBalance = await this.baseProvider.getTokenBalance(
      address,
      this.tokenIdentifier,
    );

    const response = await axios.get(
      'https://vestadex.com/api/price?pair=EGLD,VEGLD',
    );
    const tokenPrice = response.data.price;

    const addressStake = new BigNumber(tokenBalance)
      .multipliedBy(tokenPrice)
      .toFixed();

    return {
      lockedEgld: addressStake,
    };
  }

  async getLockedEgldAddresses(): Promise<string[]> {
    const holders = await this.baseProvider.getTokenHolders(
      this.tokenIdentifier,
    );

    return holders;
  }
}
