import { BigNumber } from 'bignumber.js';

export class ProviderLockedEgldInfo {
  constructor(init?: Partial<ProviderLockedEgldInfo>) {
    Object.assign(this, init);
  }

  providerName: string = '';
  lockedEgld: BigNumber = new BigNumber(0);
}
