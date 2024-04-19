import { Injectable } from '@nestjs/common';
import { LockedEgldProvider } from '@libs/common';
import { BigNumber } from 'bignumber.js';

@Injectable()
export class DemiourgosProvider extends LockedEgldProvider {
  private readonly tokenIdentifier = 'VEGLD-2b9319';
  private readonly contract = 'erd1qqqqqqqqqqqqqpgqawus4zu5w2frmhh9rscjqnu9x6msfjya2d2sfw7tsn';
  private vegldExchangeRate = '0';

  async init(): Promise<void> {
    await this.fetchVegldExchangeRate();
  }

  // eslint-disable-next-line require-await
  async getLockedEgldContracts(): Promise<string[]> {
    // return Promise.resolve([this.contract]);
    return [this.contract];
  }

  async getAddressLockedEgld(address: string): Promise<{ lockedEgld: string }> {
    const tokenBalance = await this.baseProvider.getTokenBalance(
      address,
      this.tokenIdentifier,
    );
  
    const addressStake = new BigNumber(tokenBalance)
      .multipliedBy(this.vegldExchangeRate)
      .dividedBy(1e18)
      .toFixed(0);
  
    console.log('Locked EGLD:', addressStake);
  
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

  public async fetchVegldExchangeRate() {
    const response = await this.baseProvider
      .getApiService()
      .post(`${this.baseProvider.getApiConfigService().getApiUrl()}/query`, {
        args: [],
        funcName: 'getVegldPrice',
        scAddress: this.contract,
      });

    const base64 = response.data.returnData[0];

    this.vegldExchangeRate = this.convertBase64ToDecimal(base64);
  }

  private convertBase64ToDecimal(value: string) {
    const decodedString = atob(value);

    let decimalNumber = 0;

    for (let i = 0; i < decodedString.length; i++) {
      decimalNumber = decimalNumber * 256 + decodedString.charCodeAt(i);
    }

    return String(decimalNumber);
  }
}
