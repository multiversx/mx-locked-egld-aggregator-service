import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { ApiService } from '@multiversx/sdk-nestjs-http';
import { SnapshotsService } from '../src/snapshots.service';
import { AlertsService, ApiConfigService } from '@libs/common';
import { BaseProvider } from '../../../providers/base.provider';
import { ElasticIndexerService } from '../src/elastic/elastic.indexer.service';
import { JsonExporterService } from '../src/jsonExporter/json.exporter.service';

describe('SnapshotsService', () => {
  let provider: SnapshotsService;
  let apiService: ApiService;
  let apiConfigService: ApiConfigService;
  let elasticIndexer: ElasticIndexerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaseProvider,
        SnapshotsService,
        {
          provide: JsonExporterService,
          useValue: {
            exportJson: jest.fn(),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            sendIndexerError: jest.fn(),
          },
        },
        {
          provide: ElasticIndexerService,
          useValue: {
            isIndexWritable: jest.fn(),
            addLockedEgldForAddress: jest.fn(),
          },
        },
        {
          provide: ApiService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getApiUrl: jest.fn(),
          },
        },
        Logger,
      ],
    }).compile();

    provider = module.get<SnapshotsService>(SnapshotsService);
    apiService = module.get<ApiService>(ApiService);
    apiConfigService = module.get<ApiConfigService>(ApiConfigService);
    elasticIndexer = module.get<ElasticIndexerService>(ElasticIndexerService);
  });

  describe('getStakeOfContract', () => {
    it('should return the correct contract sum when API call is successful', async () => {
      const contract = 'contract-id';
      const fakeContractData = [{ userActiveStake: new BigNumber(100) }, { userActiveStake: new BigNumber(200) }];
      const expectedContractSum = new BigNumber(300);

      jest.spyOn(apiService, 'get').mockResolvedValue({ data: fakeContractData });
      jest.spyOn(apiConfigService, 'getApiUrl').mockReturnValue('fake-api-url');

      const result = await provider.getStakeOfContract(contract);

      expect(result).toEqual(expectedContractSum);
      expect(apiService.get).toHaveBeenCalledWith('fake-api-url/accounts/contract-id/delegation');
    });
  });

  describe('isSumOfStakedLessOrEgualToContractStake', () => {
    it('isSumOfStakedLessOrEgualToContractStake should return correct values', async () => {
      const fakeContractData1 = [{ userActiveStake: new BigNumber(100) }, { userActiveStake: new BigNumber(200) }];
      const fakeContractData2 = [{ userActiveStake: new BigNumber(700) }];
      jest.spyOn(apiService, 'get').mockResolvedValueOnce({ data: fakeContractData1 });
      jest.spyOn(apiService, 'get').mockResolvedValueOnce({ data: fakeContractData2 });


      jest.spyOn(apiConfigService, 'getApiUrl').mockReturnValue('fake-api-url');

      const resultThatShouldBeTrue = await provider.isSumOfStakedLessOrEgualToContractStake("my-provider", new BigNumber(900), ["first-contract", "second-contract"]);
      expect(resultThatShouldBeTrue).toBeTruthy();

      jest.spyOn(apiService, 'get').mockResolvedValueOnce({ data: fakeContractData1 });
      jest.spyOn(apiService, 'get').mockResolvedValueOnce({ data: fakeContractData2 });
      const resultThatShouldBeFalse = await provider.isSumOfStakedLessOrEgualToContractStake("my-provider", new BigNumber(1100), ["first-contract", "second-contract"]);
      expect(resultThatShouldBeFalse).toBeFalsy();
    });
  });

  describe('getCurrentEpoch', () => {
    it('should return the epoch number when API call is successful', async () => {
      jest.spyOn(apiConfigService, 'getApiUrl').mockReturnValue('fake-api-url');
      jest.spyOn(apiService, 'get').mockResolvedValue({
        data: { epoch: 123 },
      });

      const epoch = await provider.getCurrentEpoch();

      expect(epoch).toStrictEqual(123);
      expect(apiService.get).toHaveBeenCalledWith('fake-api-url/stats');
    });

    it('should retry up to 10 times if epoch data is not available', async () => {
      jest.spyOn(apiConfigService, 'getApiUrl').mockReturnValue('fake-api-url');
      jest.spyOn(apiService, 'get').mockResolvedValue({
        data: {},
      });

      try {
        await provider.getCurrentEpoch();
      } catch (e: any) {
        expect(e.message).toMatch(/cannot get current network epoch/);
      }

      expect(apiService.get).toHaveBeenCalledTimes(10);
    });

    it('should throw an error after 10 unsuccessful attempts', async () => {
      jest.spyOn(apiConfigService, 'getApiUrl').mockReturnValue('fake-api-url');
      jest.spyOn(apiService, 'get').mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} });

      await expect(provider.getCurrentEpoch()).rejects.toThrow('cannot get current network epoch');
      expect(apiService.get).toHaveBeenCalledTimes(10);
    });
  });

  describe('addRecordsToIndexer', () => {
    it('should call getCurrentEpoch and addLockedEgldForAddress for each user', async () => {
      const users = {
        'erd1abc': [{ providerName: 'provider1', lockedEgld: new BigNumber(1000) }],
        'erd1dfg': [{ providerName: 'provider2', lockedEgld: new BigNumber(2000) }],
      };
      const currentEpoch = 123;

      jest.spyOn(provider, 'getCurrentEpoch').mockResolvedValue(currentEpoch);

      await provider.addRecordsToIndexer(users);

      expect(provider.getCurrentEpoch).toHaveBeenCalled();
      expect(elasticIndexer.addLockedEgldForAddress).toHaveBeenCalledWith('erd1abc', currentEpoch, users['erd1abc']);
      expect(elasticIndexer.addLockedEgldForAddress).toHaveBeenCalledWith('erd1dfg', currentEpoch, users['erd1dfg']);
      expect(elasticIndexer.addLockedEgldForAddress).toHaveBeenCalledTimes(2);
    });

    it('should handle no users without any errors', async () => {
      const users = {};

      jest.spyOn(provider, 'getCurrentEpoch').mockResolvedValue(123);
      await provider.addRecordsToIndexer(users);

      expect(provider.getCurrentEpoch).toHaveBeenCalled();
      expect(elasticIndexer.addLockedEgldForAddress).not.toHaveBeenCalled();
    });
  });
});
