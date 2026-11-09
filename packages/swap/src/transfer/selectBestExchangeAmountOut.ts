import { convertBuilderConfig, type WithApi } from '@paraspell/sdk-core';

import type { TGetBestAmountOutOptions } from '../types';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import { buildExchangeApiVariant } from './utils/buildExchangeApiVariant';

export const selectBestExchangeAmountOut = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
>(
  options: WithApi<
    TGetBestAmountOutOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  originApi: TApi | undefined,
) => {
  const exchangeConfig = convertBuilderConfig<TApi>(options.api.config);
  return selectBestExchangeCommon(
    options,
    originApi,
    async (
      dex,
      assetFromExchange,
      assetTo,
      options,
      parsedAmount,
      assetFromOrigin,
      feeAssetFromOrigin,
    ) => {
      const exchangeApi = await options.api.createApiForChain(dex.chain);
      const originSpecified = options.from && originApi && options.from !== dex.chain;
      return dex.getAmountOut({
        ...(await buildExchangeApiVariant(dex, exchangeConfig)),
        api: exchangeApi,
        assetFrom: assetFromExchange,
        assetTo,
        amount: BigInt(parsedAmount),
        origin:
          originSpecified && assetFromOrigin
            ? {
                api: originApi,
                chain: options.from,
                assetFrom: assetFromOrigin,
                feeAssetInfo: feeAssetFromOrigin,
              }
            : undefined,
      });
    },
  );
};
