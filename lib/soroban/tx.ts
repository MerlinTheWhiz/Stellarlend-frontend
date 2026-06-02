import type { LendingData } from '@/lib/lending/types';
import { lendingTxBuildRequestSchema } from '@/lib/validation/schemas/lending';

export type SorobanRpcError = {
  code: number | string;
  message: string;
  data?: unknown;
};

export type SorobanRpcBuildResult = {
  transaction?: string;
  transaction_xdr?: string;
  [key: string]: unknown;
};

export type SorobanRpcSubmitResult = {
  hash?: string;
  status?: string;
  [key: string]: unknown;
};

export interface TxBuildRequest {
  type: 'lend' | 'borrow';
  sourceAccount: string;
  data: LendingData;
}

export interface TxSubmitRequest {
  signedEnvelopeXdr: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function isTxBuildRequest(value: unknown): value is TxBuildRequest {
  return lendingTxBuildRequestSchema.safeParse(value).success;
}

export function isTxSubmitRequest(value: unknown): value is TxSubmitRequest {
  if (!isObject(value)) return false;
  return isNonEmptyString(value.signedEnvelopeXdr);
}

export function getSorobanNetworkPassphrase(network: string): string {
  if (network === 'public') {
    return 'Public Global Stellar Network ; September 2015';
  }

  return 'Test SDF Network ; September 2015';
}

export function buildSorobanTransactionRpcRequest(
  request: TxBuildRequest,
  contractId: string,
  network: string,
): Record<string, unknown> {
  return {
    jsonrpc: '2.0',
    id: 'build_soroban_transaction',
    method: 'build_soroban_transaction',
    params: [
      {
        source: request.sourceAccount,
        network_passphrase: getSorobanNetworkPassphrase(network),
        fee: 100,
        instructions: [buildLendingInstruction(request.type, request.data, contractId)],
      },
    ],
  };
}

export function buildSorobanSubmitRpcRequest(
  signedEnvelopeXdr: string,
): Record<string, unknown> {
  return {
    jsonrpc: '2.0',
    id: 'send_transaction',
    method: 'send_transaction',
    params: [{ tx: signedEnvelopeXdr }],
  };
}

export function extractUnsignedXdr(response: unknown): string | undefined {
  if (!isObject(response)) return undefined;
  const result = response as SorobanRpcBuildResult;
  return result.transaction ?? result.transaction_xdr;
}

export function extractSubmitResult(response: unknown): SorobanRpcSubmitResult | undefined {
  if (!isObject(response)) return undefined;
  const result = response as SorobanRpcSubmitResult;
  if (result.hash || result.status) return result;
  return undefined;
}

export function buildSorobanRpcError(error: unknown): SorobanRpcError {
  if (!isObject(error)) {
    return { code: 'UNKNOWN_ERROR', message: String(error) };
  }

  return {
    code: error.code ?? 'UNKNOWN_ERROR',
    message: typeof error.message === 'string' ? error.message : 'Unknown Soroban RPC error',
    data: error.data,
  };
}

export function buildLendingInstruction(
  action: 'lend' | 'borrow',
  data: LendingData,
  contractId: string,
): Record<string, unknown> {
  const args: Array<Record<string, unknown>> = [
    { type: 'string', value: data.asset },
    { type: 'u64', value: data.amount.toString() },
    { type: 'string', value: data.interestRate.toString() },
  ];

  if (action === 'borrow') {
    args.push({ type: 'u32', value: String(data.duration ?? 0) });
    args.push({ type: 'string', value: String(data.collateral ?? '') });
    args.push({ type: 'u64', value: String(data.collateralAmount ?? 0) });
  }

  return {
    type: 'invoke_host_function',
    function: action,
    contract_id: contractId,
    args,
    footprint: {
      read_only: [],
      read_write: [],
    },
  };
}
