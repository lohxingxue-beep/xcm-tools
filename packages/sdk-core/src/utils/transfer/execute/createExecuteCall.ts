import { getXcmPalletImpl, type TCustomChainPalletsCtx } from '@paraspell/pallets'
import { type TSubstrateChain } from '@paraspell/sdk-common'

import type { TSerializedExtrinsics, TWeight, TXcmVersioned } from '../../../types'

export const createExecuteCall = <TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xcm: TXcmVersioned<any>,
  maxWeight: TWeight,
  ctx?: TCustomChainPalletsCtx
): TSerializedExtrinsics => {
  return {
    module: getXcmPalletImpl(chain, ctx),
    method: 'execute',
    params: {
      message: xcm,
      max_weight: {
        ref_time: maxWeight.refTime,
        proof_size: maxWeight.proofSize
      }
    }
  }
}
