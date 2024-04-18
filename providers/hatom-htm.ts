import { LockedEgldProvider } from '@libs/common';
import { Injectable } from '@nestjs/common';
import { LiquidStakingUtils } from 'libs/common/src/utils/liquid-staking.utils';
import BigNumber from 'bignumber.js';

@Injectable()
export class HatomHTMProvider extends LockedEgldProvider {
  private readonly htmTokenIdentifier = 'HTM-f51d55';
  private readonly segldTokenIdentifier = 'SEGLD-3ad2d0';
  private readonly lsContract =
    'erd1qqqqqqqqqqqqqpgq4gzfcw7kmkjy8zsf04ce6dl0auhtzjx078sslvrf4e';
  private readonly liquidStaking = new LiquidStakingUtils(
    this.baseProvider,
    this.lsContract,
  );
  private readonly segldMarketAddress =
    'erd1qqqqqqqqqqqqqpgqxmn4jlazsjp6gnec95423egatwcdfcjm78ss5q550k';
  private htmSupply = '0';
  private egldAvailable = '0';

  async init(): Promise<void> {
    await this.liquidStaking.fetchLsExchangeRate();

    await Promise.all([this.fetchHTMSupply(), this.fetchEGLDAvailable()]);
  }

  private async fetchHTMSupply() {
    const response = await this.baseProvider
      .getApiService()
      .get(
        `${this.baseProvider.getApiConfigService().getApiUrl()}/tokens/${
          this.htmTokenIdentifier
        }`,
      );

    this.htmSupply = new BigNumber(response.data.supply)
      .dividedBy(1e18)
      .toString();
  }

  private async fetchEGLDAvailable() {
    const segldBalance = await this.baseProvider.getTokenBalance(
      this.segldMarketAddress,
      this.segldTokenIdentifier,
    );

    this.egldAvailable = new BigNumber(segldBalance)
      .multipliedBy(this.liquidStaking.getLsExchangeRate())
      .dividedBy(1e18)
      .toFixed(0);
  }

  async getLockedEgldContracts(): Promise<string[]> {
    return [this.lsContract];
  }

  async getAddressLockedEgld(address: string): Promise<{ lockedEgld: string }> {
    const tokenBalance = await this.baseProvider.getTokenBalance(
      address,
      this.htmTokenIdentifier,
    );

    const htmPercentage = new BigNumber(tokenBalance)
      .dividedBy(this.htmSupply)
      .toString();

    const lockedEgld = new BigNumber(this.egldAvailable)
      .multipliedBy(htmPercentage)
      .toFixed(0);

    return {
      lockedEgld,
    };
  }

  async getLockedEgldAddresses(): Promise<string[]> {
    const addresses = await this.baseProvider.getTokenHolders(
      this.htmTokenIdentifier,
    );

    return addresses;
  }
}
