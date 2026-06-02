import { describe, expect, test } from 'vitest';
import { isAccountId, isMuxedAccount, isContractId } from '@/lib/validation/stellar';

// Known valid/invalid sample addresses (using Stellar testnet examples)
const validG = 'GAKCNH54SWY4R2SAMIC2M3OLRRMIA4LYAWJJIRCJCYCBBOIO5Z3PMPJY'; // valid Ed25519 public key
const invalidG = 'GAKCNH54SWY4R2SAMIC2M3OLRRMIA4LYAWJJIRCJCYCBBOIO5Z3PMPJX'; // altered last char

const validM = 'MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // valid M format (56 chars)
const invalidM = 'MZINVALIDADDRESS1234567890';

const validC = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // valid C format (56 chars)
const invalidC = 'CZINVALIDADDRESS1234567890';

describe('Stellar address validation helpers', () => {
  test('isAccountId validates correct G address', () => {
    expect(isAccountId(validG)).toBe(true);
  });

  test('isAccountId rejects invalid G address', () => {
    expect(isAccountId(invalidG)).toBe(false);
  });

  test('isMuxedAccount validates correct M address format', () => {
    expect(isMuxedAccount(validM)).toBe(true);
  });

  test('isMuxedAccount rejects invalid M address', () => {
    expect(isMuxedAccount(invalidM)).toBe(false);
  });

  test('isContractId validates correct C address format', () => {
    expect(isContractId(validC)).toBe(true);
  });

  test('isContractId rejects invalid C address', () => {
    expect(isContractId(invalidC)).toBe(false);
  });
});
