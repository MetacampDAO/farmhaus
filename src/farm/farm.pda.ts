import { PublicKey } from '@solana/web3.js';
import { FARM_PROG_ID } from '../index';

export const findWhitelistProofPDA = async (
  farm: PublicKey,
  whitelistedAddress: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [Buffer.from('whitelist'), farm.toBytes(), whitelistedAddress.toBytes()],
    FARM_PROG_ID
  );
};