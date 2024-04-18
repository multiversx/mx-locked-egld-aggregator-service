import BigNumber from 'bignumber.js';
import { ApiConfigModule, ApiConfigService, DynamicModuleUtils, LockedEgldProvider } from '@libs/common';
import { Test } from '@nestjs/testing';
import { loadProvider } from '../../../common/provider.loader';
import { BaseProvider } from '../../../providers/base.provider';
import request from 'supertest';

function isCloseTo(value1: number, value2: number, margin = 10) {
  const difference = Math.abs(value1 - value2);
  const allowedDifference = (margin / 100) * value1;
  return difference <= allowedDifference;
}

describe.skip('Example provider testing', () => {
  let batchIterations = 0;
  let lockedEgldProvider: LockedEgldProvider;
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
    const provider = "hatom-segld";
    const network = "mainnet";
    lockedEgldProvider = await loadProvider(baseProvider, network, provider);
  });

  it('should be defined', () => {
    expect(lockedEgldProvider).toBeDefined();
    expect(lockedEgldProvider).toHaveProperty('getAddressLockedEgld');
    expect(lockedEgldProvider).toHaveProperty('getLockedEgldAddresses');
    expect(lockedEgldProvider).toHaveProperty('getLockedEgldContracts');
  });

  it('should not have empty staking address list', async () => {
    const stakingAddresses = await lockedEgldProvider.getLockedEgldAddresses();
    expect(stakingAddresses.length).toBeGreaterThan(0);
  });

  it('should not have empty staking contract list', async () => {
    const stakingContracts = await lockedEgldProvider.getLockedEgldContracts();
    expect(stakingContracts.length).toBeGreaterThan(0);
  });

  it('should return the contract stake amount', async () => {
    const stakingAddresses = await lockedEgldProvider.getLockedEgldAddresses();
    const random = Math.floor(Math.random() * stakingAddresses.length);
    const stake = await lockedEgldProvider.getAddressLockedEgld(stakingAddresses[random]);
    expect(stake).toHaveProperty('lockedEgld');
    expect(stake?.lockedEgld).toBeDefined();
    expect(stake?.lockedEgld).not.toBeNull();
  });

  it('should check the total staked amount is equal to the sum of all staking addresses', async () => {
    const API_SLEEP_TIME = apiConfigService.getTestConfigApiSleepTime();
    const BATCH_API_REQUEST_SIZE = apiConfigService.getTestConfigBatchApiRequestSize();

    const contractAddresses = await lockedEgldProvider.getLockedEgldContracts();
    const stakingAddresses = await lockedEgldProvider.getLockedEgldAddresses();
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
          const addressBalance = await lockedEgldProvider.getAddressLockedEgld(stakeAddress);
          if (addressBalance?.lockedEgld === undefined) {
            throw new Error(`Address ${stakeAddress} has undefined amount of locked EGLD`);
          }
          addressSum = addressSum.plus(addressBalance.lockedEgld);
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

