import { Injectable } from "@nestjs/common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ApiConfigService, LiquidStakingProviderInterface } from "@libs/common";
// import { ElasticService } from "@multiversx/sdk-nestjs-elastic";
import BigNumber from 'bignumber.js';

@Injectable()
export class ExampleProvider implements LiquidStakingProviderInterface {
    private readonly tokenIdentifier = 'LEGLD-d74da9';
    private readonly contracts = [
        'erd1qqqqqqqqqqqqqpgqaqxztq0y764dnet95jwtse5u5zkg92sfacts6h9su3',
    ];

    constructor(
        private readonly apiConfigService: ApiConfigService,
        private readonly apiService: ApiService,
        // private readonly elasticService: ElasticService, // uncomment this line if you want to use ElasticService
    ) { }

    // eslint-disable-next-line require-await
    async getStakingContracts(): Promise<string[]> {
        // Return hardcoded contracts. A provider also can return the contracts from an API.
        return this.contracts;
    }

    async getAddressStake(address: string): Promise<{ stake: string } | null> {
        const url = `${this.apiConfigService.getApiUrl()}/accounts/${address}/tokens/${this.tokenIdentifier}?fields=balance`;
        const { data } = await this.apiService.get(url);

        const tokenBalance = data.balance;
        const tokenPrice = 1; // TODO get LEGLD-d74da9 price in EGLD

        const addressStake = new BigNumber(tokenBalance).multipliedBy(tokenPrice).toFixed();

        return {
            stake: addressStake,
        };
    }

    async getStakingAddresses(): Promise<string[]> {
        // We return all the addresses that hold the LEGLD-d74da9 token

        const BATCH_API_REQUEST_SIZE = 50;

        const stakingAddresses: string[] = [];

        const { data: stakingAddressesCount } = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/tokens/${this.tokenIdentifier}/accounts/count`);

        for (let i = 0; i < stakingAddressesCount; i += BATCH_API_REQUEST_SIZE) {
            const { data: stakingAddressesPage } = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/tokens/${this.tokenIdentifier}/accounts`, {
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
