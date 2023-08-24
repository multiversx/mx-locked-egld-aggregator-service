import {Injectable} from "@nestjs/common";
import {ProjectsInterface} from "../projects.interface";
import {ApiService} from "@multiversx/sdk-nestjs-http";
@Injectable()
export class SalsaService implements ProjectsInterface {
    tokenName = 'LEGLD-d74da9';
    constructor(
        private readonly apiService: ApiService,
    ) {}
    async getAddressStake(address: string): Promise<{ stake: string } | null> {
        const {data: accountData} = await this.apiService.get(`https://api.multiversx.com/accounts/${address}/tokens/${this.tokenName}?fields=balance`);
        return {stake: accountData.balance};
    }

    async getStakingAddresses(): Promise<string[]> {
        const BATCH_API_REQUEST_SIZE = 50;
        let stakingAddresses: string[] = [];
        let stakingAddressesCount: number = 0;
        try{
            const { data } = await this.apiService.get(`https://api.multiversx.com/tokens/${this.tokenName}/accounts/count`);
            stakingAddressesCount = data;
        }catch(e){
            throw new Error(`Error at getting staking addresses count ${e}`);
        }

        for(let i = 0; i < stakingAddressesCount; i += BATCH_API_REQUEST_SIZE) {
            try{
                const {data: stakingAddressesApiResponse} = await this.apiService.get(`https://api.multiversx.com/tokens/${this.tokenName}/accounts?from=${i}&size=${BATCH_API_REQUEST_SIZE}`);
                const stakingAddressesBatch = stakingAddressesApiResponse.map((address: any) => address.address);
                stakingAddresses = stakingAddresses.concat(stakingAddressesBatch);
            }
            catch(e){
                throw new Error(`Error at getting staking addresses ${e}`);
            }
        }
        return stakingAddresses;
    }

    getStakingContracts(): Promise<string[]> {
        return Promise.resolve([
            'erd1qqqqqqqqqqqqqpgqaqxztq0y764dnet95jwtse5u5zkg92sfacts6h9su3',
        ]);
    }

}
