//import { TimeCoordinates } from '../common/entities/time.coordinates';
import { ApiService } from '@multiversx/sdk-nestjs-http';
import { ApiConfigService } from '@libs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseProvider {
  //timeCoordinates: TimeCoordinates;
  constructor(
    //timeCoordinates: TimeCoordinates, // TODO: set time coordinates so it can be used for historical indexing
    private readonly apiService: ApiService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    //this.timeCoordinates = timeCoordinates;
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
}
