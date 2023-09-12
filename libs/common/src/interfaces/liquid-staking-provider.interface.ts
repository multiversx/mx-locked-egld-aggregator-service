export interface LiquidStakingProviderInterface {
    /**
     * Returns the list of the provider's staking contracts
     */
    getStakingContracts(): Promise<string[]>;

    /**
    * Returns the list of all addresses participating in the provider's staking protocol
    */
    getStakingAddresses(): Promise<string[]>;

    /**
     * Returns the amount in EGLD staked by the given address
     * 
     * The returned value must be denominated. E.g.: 1 EGLD = 10^18
     * @param address The address to check
     */
    getAddressStake(address: string): Promise<{ stake: string } | null>;
}
