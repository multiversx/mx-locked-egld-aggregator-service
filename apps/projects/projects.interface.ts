export interface ProjectsInterface {
    /**
     * Returns a list of staking contracts
     */
    getStakingContracts(): Promise<string[]>;
    /**
    * Returns a list of addresses which holds liquid staking tokens
    */
    getStakingAddresses(): Promise<string[]>;
    /**
     * Returns the amount of staked tokens for a given address
     * @param address The address to check
     */
    getAddressStake(address: string): Promise<{ stake: string } | null>;
}
