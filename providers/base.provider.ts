//import { TimeCoordinates } from '../common/entities/time.coordinates';
import { ApiService } from '@multiversx/sdk-nestjs-http';
import { ApiConfigService } from '@libs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseProvider {
  //timeCoordinates: TimeCoordinates;
  constructor(
    //timeCoordinates: TimeCoordinates, // TODO: set time coordinates so it can be used for historical indexing
    private readonly apiService: ApiService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    //this.timeCoordinates = timeCoordinates;
  }

  // getTimeCoordinates(): TimeCoordinates {
  //   return this.timeCoordinates;
  // }

  // getApiService(): ApiService {
  //   return this.apiService;
  // }

  // getApiConfigService(): ApiConfigService {
  //   return this.apiConfigService;
  // }

  async getTokenBalance(address: string, token: string): Promise<string> {
    const url = `${this.apiConfigService.getApiUrl()}/accounts/${address}/tokens/${token}?extract=balance`;

    try {
      const { data: tokenBalance } = await this.apiService.get(url);

      return tokenBalance;
    } catch (error) {
      return '0';
    }
  }

  async getTokenHolders(token: string): Promise<string[]> {
    const BATCH_API_REQUEST_SIZE = 50;

    const stakingAddresses: string[] = [];

    const { data: stakingAddressesCount } = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/tokens/${token}/accounts/count`);

    for (let i = 0; i < stakingAddressesCount; i += BATCH_API_REQUEST_SIZE) {
      const { data: stakingAddressesPage } = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/tokens/${token}/accounts`, {
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
