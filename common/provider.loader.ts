import { LiquidStakingProviderInterface } from '@libs/common';
import { BaseProvider } from '../providers/base.provider';
import { DummyProvider } from '../providers/dummy';
import { DummyProvider as TestnetDummyProvider } from '../providers/testnet/dummy';
import { DummyProvider as DevnetDummyProvider } from '../providers/devnet/dummy';
import { ExampleProvider } from '../providers/example';
import { HatomProvider } from '../providers/hatom';
import { SalsaProvider } from '../providers/salsa';

export async function loadProvider(baseProvider: BaseProvider, network: string, providerName: string): Promise<LiquidStakingProviderInterface> {
  let provider: LiquidStakingProviderInterface | undefined = undefined;
  switch (network) {
    case 'mainnet':
      provider = loadMainnetProvider(baseProvider, providerName);
      break;
    case 'testnet':
      provider = loadTestnetProvider(baseProvider, providerName);
      break;
    case 'devnet':
      provider = loadDevnetProvider(baseProvider, providerName);
      break;
    default:
      throw new Error(`Invalid network: ${network}`);
  }

  if (!provider) {
    throw new Error(`Cannot load provider ${providerName} for network: ${network}. Maybe you forgot to add it to provider.loader.ts ?`);
  }
  await provider.init();
  return provider;

}

export function loadMainnetProvider(baseProvider: BaseProvider, providerName: string): LiquidStakingProviderInterface | undefined {
  switch (providerName) {
    case 'dummy':
      return new DummyProvider();
    case 'example':
      return new ExampleProvider(baseProvider);
    case 'hatom':
      return new HatomProvider(baseProvider);
    case 'salsa':
      return new SalsaProvider(baseProvider);
  }

  return;
}

export function loadTestnetProvider(_baseProvider: BaseProvider, providerName: string): LiquidStakingProviderInterface | undefined {
  switch (providerName) {
    case 'dummy':
      return new TestnetDummyProvider();
  }

  return;
}

export function loadDevnetProvider(_baseProvider: BaseProvider, providerName: string): LiquidStakingProviderInterface | undefined {
  switch (providerName) {
    case 'dummy':
      return new DevnetDummyProvider();
  }

  return;
}
