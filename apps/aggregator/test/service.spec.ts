import {ProjectsInterface} from "../src";
import {ModuleFactory} from "../src/module-factory";
import * as process from "process";
import {AvailableProjects} from "../../projects";
import BigNumber from 'bignumber.js';
const request = require('supertest');

function isCloseTo(value1: number, value2: number, margin = 10) {
    const difference = Math.abs(value1 - value2);
    const allowedDifference = (margin / 100) * value1;
    return difference <= allowedDifference;
}

describe('Projects service testing', () => {

    const ACCEPABLE_PERCENTAGE_DIFFERENCE = 10;

    let service: ProjectsInterface;
    // eslint-disable-next-line require-await
    beforeAll(async () => {
        const module: AvailableProjects = process.env.MODULE_NAME as AvailableProjects || AvailableProjects.Sample; // default to 'Sample' if no env provided
        service = ModuleFactory.getService(module);
    });


    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(service).toHaveProperty('getAddressStake');
        expect(service).toHaveProperty('getStakingAddresses');
        expect(service).toHaveProperty('getStakingContracts');
    });

    it('should not have empty staking address list', async() => {
        const stakingAddresses = await service.getStakingAddresses();
        expect(stakingAddresses.length).toBeGreaterThan(0);
    });

    it('should not have empty staking contract list', async() => {
        const stakingContracts = await service.getStakingContracts();
        expect(stakingContracts.length).toBeGreaterThan(0);
    });

    it('should return the contract stake amount', async() => {
        const stakingAddresses = await service.getStakingAddresses();
        const random = Math.floor(Math.random() * stakingAddresses.length);
        const stake = await service.getAddressStake(stakingAddresses[random]);
        expect(stake).toHaveProperty('stake');
        expect(stake?.stake).toBeDefined();
        expect(stake?.stake).not.toBeNull();
    });

    it('should check the total staked amount is equal to the sum of all staking addresses', async() => {
        const contractAddresses = await service.getStakingContracts();
        const stakingAddresses = await service.getStakingAddresses();
        let contractSum = new BigNumber(0);
        let addressSum = new BigNumber(0);
        for (const contract of contractAddresses) {
            try {
                const {body: contractData} = await request(`https://api.multiversx.com/`).get(`accounts/${contract}/delegation`);
                contractData.forEach((delegation: any) => {
                    contractSum = contractSum.plus(delegation.userActiveStake);
                });
            } catch (e) {
                console.log(e);
            }
            for(let i = 0 ; i < stakingAddresses.length ; i++) {
                try {
                    const addressBalance = await service.getAddressStake(stakingAddresses[i]);
                    if(addressBalance?.stake === undefined) throw new Error(`Address ${stakingAddresses[i]} has undefined stake`);
                    addressSum = addressSum.plus(addressBalance.stake);
                    if(i%10 === 0){
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        console.log(`Batch ${i} executed`);
                    }
                } catch (e) {
                    throw new Error(`Error at batch ${i}`);
                }
            }
            const denominatedContractSum = contractSum.dividedBy(10**18).toNumber();
            const denominatedAddressSum = addressSum.dividedBy(10**18).toNumber();
            expect(isCloseTo(denominatedContractSum, denominatedAddressSum, ACCEPABLE_PERCENTAGE_DIFFERENCE)).toBe(true);
        }
    }, 1000000);
});

