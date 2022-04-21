import * as anchor from '@project-serum/anchor';
import { BN, Idl, Program, AnchorProvider } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import {
  AccountInfo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Farm } from '../../target/types/farm';
import { AccountUtils, isKp } from '../farm-common';
import { findWhitelistProofPDA } from './farm.pda';

export enum WhitelistType {
  Creator = 1 << 0,
  Mint = 1 << 1,
}

export class FarmClient extends AccountUtils {
  // @ts-ignore
  wallet: anchor.Wallet;
  provider!: anchor.Provider;
  farmProgram!: anchor.Program<Farm>;

  constructor(
    conn: Connection,
    // @ts-ignore
    wallet: anchor.Wallet,
    idl?: Idl,
    programId?: PublicKey
  ) {
    super(conn);
    this.wallet = wallet;
    this.setProvider();
    this.setFarmProgram(idl, programId);
  }

  setProvider() {
    this.provider = new AnchorProvider(
      this.conn,
      this.wallet,
      AnchorProvider.defaultOptions()
    );
    anchor.setProvider(this.provider);
  }

  setFarmProgram(idl?: Idl, programId?: PublicKey) {
    //instantiating program depends on the environment
    if (idl && programId) {
      //means running in prod
      this.farmProgram = new anchor.Program<Farm>(
        idl as any,
        programId,
        this.provider
      );
    } else {
      //means running inside test suite
      // @ts-ignore
      this.farmProgram = anchor.workspace.Farm as Program<Farm>;
    }
  }

  // --------------------------------------- fetch deserialized accounts

  async fetchFarmAcc(farm: PublicKey) {
    return this.farmProgram.account.farm.fetch(farm);
  }

  async fetchWhitelistProofAcc(proof: PublicKey) {
    return this.farmProgram.account.whitelistProof.fetch(proof);
  }

  // --------------------------------------- get all PDAs by type
  //https://project-serum.github.io/anchor/ts/classes/accountclient.html#all

  async fetchAllFarmPDAs(manager?: PublicKey) {
    const filter = manager
      ? [
          {
            memcmp: {
              offset: 10, //need to prepend 8 bytes for anchor's disc
              bytes: manager.toBase58(),
            },
          },
        ]
      : [];
    const pdas = await this.farmProgram.account.farm.all(filter);
    console.log(`found a total of ${pdas.length} farm PDAs`);
    return pdas;
  }

  async fetchAllWhitelistProofPDAs(farm?: PublicKey) {
    const filter = farm
      ? [
          {
            memcmp: {
              offset: 41, //need to prepend 8 bytes for anchor's disc
              bytes: farm.toBase58(),
            },
          },
        ]
      : [];
    const pdas = await this.farmProgram.account.whitelistProof.all(filter);
    console.log(`found a total of ${pdas.length} whitelist proofs`);
    return pdas;
  }
  



  // --------------------------------------- execute ixs

  async initFarm(
    farm: Keypair,
    developer: PublicKey | Keypair,
    payer: PublicKey | Keypair
  ) {
    const signers = [farm];
    if (isKp(developer)) signers.push(<Keypair>developer);

    console.log('starting farm at', farm.publicKey.toBase58());
    const txSig = await this.farmProgram.methods.initFarm().accounts({
        farm: farm.publicKey,
        developer: isKp(developer) ? (<Keypair>developer).publicKey : developer,
        payer: isKp(payer) ? (<Keypair>payer).publicKey : payer,
        systemProgram: SystemProgram.programId,
      }).signers(signers).rpc();

    return { txSig };
  }

  async updateDeveloper(
    farm: PublicKey,
    developer: PublicKey | Keypair,
    newDeveloper: PublicKey
  ) {
    const signers = [];
    if (isKp(developer)) signers.push(<Keypair>developer);

    console.log('updating developer to ', newDeveloper.toBase58());
    const txSig = await this.farmProgram.methods.updateDeveloper().accounts({
      farm: farm,
      developer: isKp(developer)
        ? (<Keypair>developer).publicKey
        : developer,
      newDeveloper: newDeveloper
    }).signers(signers).rpc();

    return {txSig };
  }

  async addToWhitelist(
    farm: PublicKey,
    developer: PublicKey | Keypair,
    addressToWhitelist: PublicKey,
    whitelistType: WhitelistType,
    payer?: PublicKey
  ) {
    const developerPk = isKp(developer)
      ? (<Keypair>developer).publicKey
      : <PublicKey>developer;

    const [whitelistProof, whitelistBump] = await findWhitelistProofPDA(
      farm,
      addressToWhitelist
    );

    const signers = [];
    if (isKp(developer)) signers.push(<Keypair>developer);

    const txSig = await this.farmProgram.methods.addToWhitelist(whitelistType).accounts({
      farm,
      developer: developerPk,
      addressToWhitelist,
      whitelistProof,
      systemProgram: SystemProgram.programId,
      payer: payer?? developerPk,
    }).signers(signers).rpc();

    return { whitelistProof, whitelistBump, txSig };
  }
}
