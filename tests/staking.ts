import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FarmClient, NodeWallet } from '../src';

describe('farm', () => {
  // Configure the client to use the local cluster.
  const _provider = anchor.AnchorProvider.env();
  const farmClient = new FarmClient(_provider.connection, _provider.wallet as any);
  const nw = new NodeWallet(_provider.connection, _provider.wallet as any);

  // --------------------------------------- farm 
  //global state
  let randomWallet: Keypair; //used to test bad transactions with wrong account passed in
  const farm = Keypair.generate();
  let manager: Keypair;

  function printFarmVaultState() {
    console.log('randomWallet', randomWallet.publicKey.toBase58());
    console.log('farm', farm.publicKey.toBase58());
    console.log('manager', manager.publicKey.toBase58());
  }

  before('configures accounts', async () => {
    randomWallet = await nw.createFundedWallet(100 * LAMPORTS_PER_SOL);
    manager = await nw.createFundedWallet(100 * LAMPORTS_PER_SOL);
  });

  it('inits farm', async () => {
    await farmClient.initFarm(farm, manager, manager);

    const farmAcc = await farmClient.fetchFarmAcc(farm.publicKey);
    assert.equal(
      farmAcc.manager.toBase58(),
      manager.publicKey.toBase58()
    );
    assert(farmAcc.vaultCount.eq(new BN(0)));
  });

});
