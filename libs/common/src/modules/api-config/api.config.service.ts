import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NetworkType } from '../../entities';

@Injectable()
export class ApiConfigService implements ApiConfigService {
  constructor(private readonly config: ConfigService) { }

  getNetwork(): NetworkType {
    return this.getGenericConfig('network', {
      defaultValue: NetworkType.MAINNET,
    });
  }

  getApiPort(): number {
    return this.getGenericConfig('apps.api.port');
  }


  getApiPrefix(): string {
    return this.getGenericConfig('apps.api.prefix');
  }

  getRedisUrl(): string {
    return this.getGenericConfig('urls.redis');
  }

  getRateLimiterSecret(): string | null {
    return this.getGenericConfig('rateLimiterSecret', { defaultValue: null });
  }

  getUseKeepAliveAgentFlag(): boolean {
    return this.getGenericConfig('flags.useKeepAliveAgent', { defaultValue: true });
  }

  getAxiosTimeout(): number {
    return this.getGenericConfig('keepAliveTimeout.downstream', { defaultValue: 61000 });
  }

  getServerTimeout(): number {
    return this.getGenericConfig('keepAliveTimeout.upstream', { defaultValue: 60000 });
  }

  getHeadersTimeout(): number {
    return this.getServerTimeout() + 1000;
  }

  getSlackWebhookUrl(): string | null {
    return this.getGenericConfig('slack.webhookUrl', { defaultValue: null });
  }


  getElasticUrl(): string {
    return this.getGenericConfig('urls.elastic');
  }

  getInternalElasticUrl(): string {
    return this.getGenericConfig('urls.internalElastic');
  }

  getApiUrl(): string {
    return this.getGenericConfig('urls.api');
  }

  getDataApiUrl(): string {
    return this.getGenericConfig('urls.dataApi');
  }

  getGatewayUrl(): string {
    return this.getGenericConfig('urls.gateway');
  }

  getGenericConfig<T>(key: string, options?: { defaultValue: T }): T {
    const config = this.config.get<T>(key);

    if (config === undefined && options) {
      return options.defaultValue;
    }

    if (config === undefined) {
      throw new Error(`No ${key} present`);
    }

    return config;
  }
}
