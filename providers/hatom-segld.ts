import { LockedEgldProvider } from '@libs/common';
import { Injectable } from '@nestjs/common';
import { LiquidStakingUtils } from 'libs/common/src/utils/liquid-staking.utils';
import BigNumber from 'bignumber.js';

@Injectable()
export class HatomSEGLDProvider extends LockedEgldProvider {
  private readonly lsTokenIdentifier = 'SEGLD-3ad2d0';
  private readonly lsContract =
    'erd1qqqqqqqqqqqqqpgq4gzfcw7kmkjy8zsf04ce6dl0auhtzjx078sslvrf4e';
  private readonly liquidStaking = new LiquidStakingUtils(
    this.baseProvider,
    this.lsContract,
  );
  private readonly segldMarketAddress =
    'erd1qqqqqqqqqqqqqpgqxmn4jlazsjp6gnec95423egatwcdfcjm78ss5q550k';

  async init(): Promise<void> {
    await this.liquidStaking.fetchLsExchangeRate();
  }

  async getLockedEgldContracts(): Promise<string[]> {
    return [this.lsContract];
  }

  async getAddressLockedEgld(address: string): Promise<{ lockedEgld: string }> {
    const tokenBalance = await this.baseProvider.getTokenBalance(
      address,
      this.lsTokenIdentifier,
    );

    const addressStake = new BigNumber(tokenBalance)
      .multipliedBy(this.liquidStaking.getLsExchangeRate())
      .dividedBy(1e18)
      .toFixed(0);

    return {
      lockedEgld: addressStake,
    };
  }

  async getLockedEgldAddresses(): Promise<string[]> {
    const addresses = await this.baseProvider.getTokenHolders(
      this.lsTokenIdentifier,
    );

    const filteredAddresses = addresses.filter(
      (address) => this.segldMarketAddress !== address,
    );

    return filteredAddresses;
  }
}
