import type { TAssetInfo } from '@paraspell/sdk';
import type { PolkadotApi } from '@paraspell/sdk-core';
import { describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TGetBestAmountOutOptions } from '../types';

const mockApi = {
  createApiForChain: vi.fn().mockResolvedValue({}),
} as unknown as PolkadotApi<unknown, unknown, unknown>;
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

vi.mock('./selectBestExchangeCommon');

describe('selectBestExchangeAmountOut', () => {
  const mockOptions = {
    from: 'fromDex',
    to: 'toDex',
    currencyFrom: { symbol: 'AAA' },
    currencyTo: { symbol: 'BBB' },
    amount: 10,
    api: mockApi,
  } as unknown as TGetBestAmountOutOptions<unknown, unknown, unknown>;

  it('should compute the amount out using the dex callback and return the best exchange', async () => {
    const fakeDex = {
      apiType: 'PJS',
      createApiInstance: vi.fn().mockResolvedValue('fakeApi'),
      createApiInstancePapi: vi.fn().mockResolvedValue('fakePapiApi'),
      getAmountOut: vi.fn().mockResolvedValue(300n),
      chain: 'dummyDex',
      exchangeChain: 'dummyExchange',
    } as unknown as ExchangeChain;

    vi.mocked(selectBestExchangeCommon).mockImplementation(
      async (options, _originApi, computeAmountOut) => {
        const result = await computeAmountOut(
          fakeDex,
          'assetFrom' as unknown as TAssetInfo,
          'assetTo' as unknown as TAssetInfo,
          options,
          String(options.amount),
        );
        expect(result).toBe(300n);
        return fakeDex;
      },
    );

    const createApiSpy = vi.spyOn(fakeDex, 'createApiInstance');
    const getAmountOutSpy = vi.spyOn(fakeDex, 'getAmountOut');

    const originApi = undefined;

    const bestExchange = await selectBestExchangeAmountOut(mockOptions, originApi);
    expect(bestExchange).toBe(fakeDex);
    expect(createApiSpy).toHaveBeenCalledTimes(1);
    expect(getAmountOutSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apiPjs: 'fakeApi',
        assetFrom: 'assetFrom',
        assetTo: 'assetTo',
        amount: BigInt(mockOptions.amount),
      }),
    );
  });

  it('should forward origin info to dex.getAmountOut when originApi and assetFromOrigin are present', async () => {
    const fakeDex = {
      apiType: 'PJS',
      createApiInstance: vi.fn().mockResolvedValue('fakeApi'),
      createApiInstancePapi: vi.fn().mockResolvedValue('fakePapiApi'),
      getAmountOut: vi.fn().mockResolvedValue(297n),
      chain: 'dummyDex',
      exchangeChain: 'dummyExchange',
    } as unknown as ExchangeChain;

    const originAsset = { symbol: 'AAA', decimals: 10 } as TAssetInfo;
    const feeAsset = { symbol: 'FEE', decimals: 10 } as TAssetInfo;

    vi.mocked(selectBestExchangeCommon).mockImplementation(
      async (options, _originApi, computeAmountOut) => {
        await computeAmountOut(
          fakeDex,
          'assetFrom' as unknown as TAssetInfo,
          'assetTo' as unknown as TAssetInfo,
          options,
          String(options.amount),
          originAsset,
          feeAsset,
        );
        return fakeDex;
      },
    );

    const getAmountOutSpy = vi.spyOn(fakeDex, 'getAmountOut');
    const originApi = 'mockOriginApi';

    await selectBestExchangeAmountOut(mockOptions, originApi);

    expect(getAmountOutSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: {
          api: originApi,
          chain: 'fromDex',
          assetFrom: originAsset,
          feeAssetInfo: feeAsset,
        },
      }),
    );
  });

  it('should propagate errors thrown by selectBestExchangeCommon', async () => {
    const testError = new Error('Test error');
    vi.mocked(selectBestExchangeCommon).mockRejectedValue(testError);
    await expect(selectBestExchangeAmountOut(mockOptions, undefined)).rejects.toThrow('Test error');
  });
});
