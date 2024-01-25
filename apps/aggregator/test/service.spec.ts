import * as process from 'process';
import BigNumber from 'bignumber.js';
import { ApiConfigModule, ApiConfigService, DynamicModuleUtils, LiquidStakingProviderInterface } from '@libs/common';
import parseArgs from 'minimist';
import { Test } from '@nestjs/testing';
import { loadProvider } from '../../../common/provider.loader';
import { BaseProvider } from '../../../providers/base.provider';
import request from 'supertest';

function isCloseTo(value1: number, value2: number, margin = 10) {
  const difference = Math.abs(value1 - value2);
  const allowedDifference = (margin / 100) * value1;
  return difference <= allowedDifference;
}

describe('Projects service testing', () => {
  let batchIterations = 0;
  let liquidStakingProvider: LiquidStakingProviderInterface;
  let baseProvider: BaseProvider;
  let apiConfigService: ApiConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ApiConfigModule,
        DynamicModuleUtils.getApiModule(),
        DynamicModuleUtils.getElasticModule(),
      ],
      providers: [
        BaseProvider,
      ],
    }).compile();

    apiConfigService = moduleRef.get(ApiConfigService);
    baseProvider = moduleRef.get(BaseProvider);
    const { provider, network } = parseArgs(process.argv);
    liquidStakingProvider = await loadProvider(baseProvider, network, provider);
  });

  it('should be defined', () => {
    expect(liquidStakingProvider).toBeDefined();
    expect(liquidStakingProvider).toHaveProperty('getAddressStake');
    expect(liquidStakingProvider).toHaveProperty('getStakingAddresses');
    expect(liquidStakingProvider).toHaveProperty('getStakingContracts');
  });

  it('should not have empty staking address list', async () => {
    const stakingAddresses = await liquidStakingProvider.getStakingAddresses();
    expect(stakingAddresses.length).toBeGreaterThan(0);
  });

  it('should not have empty staking contract list', async () => {
    const stakingContracts = await liquidStakingProvider.getStakingContracts();
    expect(stakingContracts.length).toBeGreaterThan(0);
  });

  it('should return the contract stake amount', async () => {
    const stakingAddresses = await liquidStakingProvider.getStakingAddresses();
    const random = Math.floor(Math.random() * stakingAddresses.length);
    const stake = await liquidStakingProvider.getAddressStake(stakingAddresses[random]);
    expect(stake).toHaveProperty('stake');
    expect(stake?.stake).toBeDefined();
    expect(stake?.stake).not.toBeNull();
  });

  it('should check the total staked amount is equal to the sum of all staking addresses', async () => {
    const API_SLEEP_TIME = apiConfigService.getTestConfigApiSleepTime();
    const BATCH_API_REQUEST_SIZE = apiConfigService.getTestConfigBatchApiRequestSize();

    const contractAddresses = await liquidStakingProvider.getStakingContracts();
    const stakingAddresses = await liquidStakingProvider.getStakingAddresses();
    let contractSum = new BigNumber(0);
    let addressSum = new BigNumber(0);
    for (const contract of contractAddresses) {
      try {
        const { body: contractData } = await request(`${apiConfigService.getApiUrl()}`).get(`/accounts/${contract}/delegation`);
        contractSum = contractData.reduce((acc: BigNumber, curr: any) => {
          return acc.plus(curr.userActiveStake);
        }, contractSum);
      } catch (e) {
        throw new Error(`Error at contract ${contract}: ${e}`);
      }
      for (const stakeAddress of stakingAddresses) {
        try {
          const addressBalance = await liquidStakingProvider.getAddressStake(stakeAddress);
          if (addressBalance?.stake === undefined) {
            throw new Error(`Address ${stakeAddress} has undefined stake`);
          }
          addressSum = addressSum.plus(addressBalance.stake);
          if (batchIterations % BATCH_API_REQUEST_SIZE === 0) {
            await new Promise(resolve => setTimeout(resolve, API_SLEEP_TIME));
            console.log(`Batch ${batchIterations} executed`);
          }
          batchIterations++;
        } catch (e) {
          throw new Error(`Error at batch ${batchIterations}: ${e}`);
        }
      }
      const denominatedContractSum = contractSum.shiftedBy(-18).toNumber();
      const denominatedAddressSum = addressSum.shiftedBy(-18).toNumber();
      console.log(`Contract sum: ${denominatedContractSum}`);
      console.log(`Address sum: ${denominatedAddressSum}`);
      expect(denominatedContractSum).toBeGreaterThan(0);
      expect(denominatedAddressSum).toBeGreaterThan(0);

      const ACCEPTABLE_PERCENTAGE_DIFFERENCE = apiConfigService.getTestConfigAcceptablePercentageDifference();
      expect(isCloseTo(denominatedContractSum, denominatedAddressSum, ACCEPTABLE_PERCENTAGE_DIFFERENCE)).toBe(true);
    }
  }, 1000000);
});

