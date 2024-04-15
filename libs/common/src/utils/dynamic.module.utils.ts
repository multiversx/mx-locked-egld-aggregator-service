// TODO
import { DynamicModule, Provider } from '@nestjs/common';
import { ApiConfigModule, ApiConfigService } from '../modules';
import {
  ClientOptions,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { ApiModule, ApiModuleOptions } from '@multiversx/sdk-nestjs-http';
import {
  ElasticModule,
  ElasticModuleOptions,
} from '@multiversx/sdk-nestjs-elastic';

export const REDIS_COMMON_CLIENT = 'REDIS_COMMON_CLIENT';

export class DynamicModuleUtils {
  static getApiModule(): DynamicModule {
    return ApiModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      useFactory: (apiConfig: ApiConfigService) =>
        new ApiModuleOptions({
          axiosTimeout: apiConfig.getAxiosTimeout(),
          rateLimiterSecret: apiConfig.getRateLimiterSecret() ?? undefined,
          serverTimeout: apiConfig.getServerTimeout(),
          useKeepAliveAgent: apiConfig.getUseKeepAliveAgentFlag(),
        }),
    });
  }

  static getElasticModule(): DynamicModule {
    return ElasticModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) =>
        new ElasticModuleOptions({
          url: apiConfigService.getElasticUrl(),
          customValuePrefix: 'liquid',
        }),
      inject: [ApiConfigService],
    });
  }

  static getInternalElasticModule(): DynamicModule {
    return ElasticModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) =>
        new ElasticModuleOptions({
          url: apiConfigService.getInternalElasticUrl(),
          customValuePrefix: 'internal',
        }),
      inject: [ApiConfigService],
    });
  }


  // static getNestJsApiConfigService(): Provider {
  //   return {
  //     provide: ERDNEST_CONFIG_SERVICE,
  //     useClass: ErdnestConfigServiceImpl,
  //   };
  // }

  // static getCachingModule(): DynamicModule {
  //   return ElrondCachingModule.forRootAsync({
  //     imports: [ApiConfigModule],
  //     useFactory: (apiConfig: ApiConfigService) => ({
  //       config: {
  //         host: apiConfig.getRedisUrl(),
  //       },
  //     }),
  //     inject: [ApiConfigService],
  //   });
  // }

  // static getRedisCommonModule(): DynamicModule {
  //   return RedisModule.forRootAsync(
  //     {
  //       imports: [ApiConfigModule],
  //       inject: [ApiConfigService],
  //       // @ts-ignore
  //       useFactory: (apiConfig: ApiConfigService) => {
  //         const redisCommonConfig = apiConfig.getRedisCommonConfig();

  //         return {
  //           config: {
  //             keyPrefix: 'kyc:',
  //             host: redisCommonConfig.host,
  //             port: redisCommonConfig.port,
  //             username: redisCommonConfig.username,
  //             password: redisCommonConfig.password,
  //             tls: redisCommonConfig.tls,
  //           },
  //         };
  //       },
  //     },
  //     REDIS_COMMON_CLIENT
  //   );
  // }

  static getPubSubService(): Provider {
    return {
      provide: 'PUBSUB_SERVICE',
      useFactory: (apiConfig: ApiConfigService) => {
        const clientOptions: ClientOptions = {
          transport: Transport.REDIS,
          options: {
            host: apiConfig.getRedisUrl(),
            port: 6379,
            retryDelay: 1000,
            retryAttempts: 10,
            retryStrategy: () => 1000,
          },
        };

        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ApiConfigService],
    };
  }
}
