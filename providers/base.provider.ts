//import { TimeCoordinates } from '../common/entities/time.coordinates';
import { ApiService } from '@multiversx/sdk-nestjs-http';
import { ApiConfigService } from '@libs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseProvider {
  //timeCoordinates: TimeCoordinates;
  constructor(
    //timeCoordinates: TimeCoordinates,
    private readonly apiService: ApiService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    //this.timeCoordinates = timeCoordinates;
    console.log(`Base provider initialized. api port: ${apiConfigService.getApiPort()}. ${apiService}.`);
  }

  // getTimeCoordinates(): TimeCoordinates {
  //   return this.timeCoordinates;
  // }

  getApiService(): ApiService {
    return this.apiService;
  }

  getApiConfigService(): ApiConfigService {
    return this.apiConfigService;
  }

  get(): string {
    return "";
    //return `params: {timeCoordinates: epoch: ${this.timeCoordinates.epoch}, timestamp: ${this.timeCoordinates.timestamp}}, {api service}`;
  }
}
