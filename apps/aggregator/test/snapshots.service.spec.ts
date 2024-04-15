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
  });

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

  it('isSumOfStakedLessOrEgualToContractStake should return correct values', async () => {
    const fakeContractData1 = [{ userActiveStake: new BigNumber(100) }, { userActiveStake: new BigNumber(200) }];
    const fakeContractData2 = [{ userActiveStake: new BigNumber(700) }];
    jest.spyOn(apiService, 'get').mockResolvedValueOnce({ data: fakeContractData1 });
    jest.spyOn(apiService, 'get').mockResolvedValueOnce({ data: fakeContractData2 });


    jest.spyOn(apiConfigService, 'getApiUrl').mockReturnValue('fake-api-url');

    const resultThatShouldBeTrue = await provider.isSumOfStakedLessOrEgualToContractStake("my-provider", new BigNumber(900), ["first-contract", "second-contract"]);
    expect(resultThatShouldBeTrue).toBeTruthy();

    const resultThatShouldBeFalse = await provider.isSumOfStakedLessOrEgualToContractStake("my-provider", new BigNumber(1100), ["first-contract", "second-contract"]);
    expect(resultThatShouldBeFalse).toBeFalsy();
  });
});
