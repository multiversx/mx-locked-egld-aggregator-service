import { Injectable } from '@nestjs/common';
import { LiquidStakingProviderInterface } from '@libs/common';
import BigNumber from 'bignumber.js';
import { BaseProvider } from './base.provider';

@Injectable()
export class HatomProvider implements LiquidStakingProviderInterface {
  private readonly baseProvider: BaseProvider;
  private readonly tokenIdentifier = 'SEGLD-3ad2d0';
  private readonly contracts = [
    'erd1qqqqqqqqqqqqqpgq4gzfcw7kmkjy8zsf04ce6dl0auhtzjx078sslvrf4e',
  ];

  constructor(
    baseProvider: BaseProvider,
  ) {
    this.baseProvider = baseProvider;
  }

  init(): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line require-await
  async getStakingContracts(): Promise<string[]> {
    // Return hardcoded contracts. A provider also can return the contracts from an API.
    return this.contracts;
  }

  async getAddressStake(address: string): Promise<{ stake: string } | null> {
    const url = `${this.baseProvider.getApiConfigService().getApiUrl()}/accounts/${address}/tokens/${this.tokenIdentifier}?fields=balance`;
    const { data } = await this.baseProvider.getApiService().get(url);

    const tokenBalance = data.balance;
    const tokenPrice = 1; // TODO get SEGLD-3ad2d0 price in EGLD

    const addressStake = new BigNumber(tokenBalance).multipliedBy(tokenPrice).toFixed();

    return {
      stake: addressStake,
    };
  }

  async getStakingAddresses(): Promise<string[]> {
    // We return all the addresses that hold the SEGLD-3ad2d0 token

    const BATCH_API_REQUEST_SIZE = 50;

    const stakingAddresses: string[] = [];

    const { data: stakingAddressesCount } = await this.baseProvider.getApiService().get(`${this.baseProvider.getApiConfigService().getApiUrl()}/tokens/${this.tokenIdentifier}/accounts/count`);

    for (let i = 0; i < stakingAddressesCount; i += BATCH_API_REQUEST_SIZE) {
      const { data: stakingAddressesPage } = await this.baseProvider.getApiService().get(`${this.baseProvider.getApiConfigService().getApiUrl()}/tokens/${this.tokenIdentifier}/accounts`, {
        params: {
          from: i,
          size: BATCH_API_REQUEST_SIZE,
          fields: 'address',
        },
      });

      stakingAddresses.push(...stakingAddressesPage.map((address: any) => address.address));
    }

    return stakingAddresses;
  }
}
