import { BaseProvider } from 'providers/base.provider';

export class LiquidStakingUtils {
  private lsExchangeRate = '0';

  constructor(
    private readonly baseProvider: BaseProvider,
    private readonly lsContract: string,
  ) {}

  public getLsExchangeRate() {
    return this.lsExchangeRate;
  }

  public async fetchLsExchangeRate() {
    const response = await this.baseProvider
      .getApiService()
      .post(`${this.baseProvider.getApiConfigService().getApiUrl()}/query`, {
        args: [],
        funcName: 'getExchangeRate',
        scAddress: this.lsContract,
      });

    const base64 = response.data.returnData[0];

    this.lsExchangeRate = this.convertBase64ToDecimal(base64);
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
