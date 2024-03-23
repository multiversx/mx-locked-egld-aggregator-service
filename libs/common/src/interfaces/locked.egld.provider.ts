import { BaseProvider } from "providers/base.provider";

export abstract class LockedEgldProvider {
  constructor(
    protected readonly baseProvider: BaseProvider
  ) { }

  /**
   * Handled the initialization of the providers (fetch configuration, parity and so on)
   */
  init(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Returns the list of the provider's locked EGLD contracts
   */
  getLockedEgldContracts(): Promise<string[]> {
    return Promise.resolve([]);
  }

  /**
  * Returns the list of all addresses participating in the provider's EGLD locking protocol
  */
  getLockedEgldAddresses(): Promise<string[]> {
    return Promise.resolve([]);
  }

  /**
   * Returns the amount in EGLD of locked EGLD by the given address
   * 
   * The returned value must be denominated. E.g.: 1 EGLD = 10^18
   * @param address The address to check
   */
  getAddressLockedEgld(_address: string): Promise<{ lockedEgld: string }> {
    return Promise.resolve({ lockedEgld: '0' });
  }
}
