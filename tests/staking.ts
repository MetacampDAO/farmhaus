import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FarmClient, NodeWallet, WhitelistType, ITokenData } from '../src';

describe('farm', () => {
  // Configure the client to use the local cluster.
  const _provider = anchor.AnchorProvider.env();
  const fc = new FarmClient(_provider.connection, _provider.wallet as any);
  const nw = new NodeWallet(_provider.connection, _provider.wallet as any);

  // --------------------------------------- farm 
  //global state
  let randomWallet: Keypair; //used to test bad transactions with wrong account passed in
  const farm = Keypair.generate();
  let developer: Keypair;

  function printFarmVaultState() {
    console.log('randomWallet', randomWallet.publicKey.toBase58());
    console.log('farm', farm.publicKey.toBase58());
    console.log('developer', developer.publicKey.toBase58());
  }

  before('configures accounts', async () => {
    randomWallet = await nw.createFundedWallet(100 * LAMPORTS_PER_SOL);
    developer = await nw.createFundedWallet(100 * LAMPORTS_PER_SOL);
  });

  it('inits farm', async () => {
    await fc.initFarm(farm, developer, developer);

    const farmAcc = await fc.fetchFarmAcc(farm.publicKey);
    assert.equal(
      farmAcc.developer.toBase58(),
      developer.publicKey.toBase58()
    );
    assert(farmAcc.vaultCount.eq(new BN(0)));
  });

  it('updates developer', async () => {
    const newDeveloper = Keypair.generate();
    await fc.updateDeveloper(
      farm.publicKey,
      developer,
      newDeveloper.publicKey
    );

    const farmAcc = await fc.fetchFarmAcc(farm.publicKey);
    assert.equal(
      farmAcc.developer.toBase58(),
      newDeveloper.publicKey.toBase58()
    );

    //reset back
    await fc.updateDeveloper(
      farm.publicKey,
      newDeveloper,
      developer.publicKey
    );
  });

  describe('updating whitelists', () => {
    //global state
    let nftAmount: anchor.BN;
    let nft: ITokenData;

    async function prepGem(owner?: Keypair) {
      const nftAmount = new BN(1); //min 2
      const nftOwner =
        owner ?? (await nw.createFundedWallet(100 * LAMPORTS_PER_SOL));
      const nft = await nw.createMintAndFundATA(nftOwner.publicKey, nftAmount);

      return { nftAmount, nftOwner, nft };
    }


    async function prepAddToWhitelist(addr: PublicKey, type: WhitelistType) {
      return fc.addToWhitelist(farm.publicKey, developer, addr, type);
    }

    async function whitelistMint(whitelistedMint: PublicKey) {
      const { whitelistProof } = await prepAddToWhitelist(
        whitelistedMint,
        WhitelistType.Mint
      );
      return { whitelistedMint, whitelistProof };
    }

    async function whitelistCreator(whitelistedCreator: PublicKey) {
      const { whitelistProof } = await prepAddToWhitelist(
        whitelistedCreator,
        WhitelistType.Creator
      );
      return { whitelistedCreator, whitelistProof };
    }

    async function assertWhitelistClean() {
      const pdas = await fc.fetchAllWhitelistProofPDAs();
      assert.equal(pdas.length, 0);

      const farmAcc = await fc.fetchFarmAcc(farm.publicKey);
      assert.equal(farmAcc.whitelistedMints, 0);
      assert.equal(farmAcc.whitelistedCreators, 0);
    }

    beforeEach('checks whitelists are clean', async () => {
      //many gems, different amounts, but same owner (who also owns the vault)
      ({ nftAmount, nft } = await prepGem());
      // await assertWhitelistClean();
    });

    it('adds mint to whitelist', async () => {
      const { whitelistedMint, whitelistProof } = await whitelistMint(
        nft.tokenMint,
      );
      const proofAcc = await fc.fetchWhitelistProofAcc(whitelistProof);
      assert.equal(proofAcc.whitelistType, WhitelistType.Mint);
      assert.equal(proofAcc.farm.toBase58(), farm.publicKey.toBase58());
      assert.equal(
        proofAcc.whitelistedAddress.toBase58(),
        whitelistedMint.toBase58()
      );
    });

    it('adds creator to whitelist', async () => {
      const { whitelistedCreator, whitelistProof } = await whitelistCreator(
        randomWallet.publicKey
      );
      const proofAcc = await fc.fetchWhitelistProofAcc(whitelistProof);
      assert.equal(proofAcc.whitelistType, WhitelistType.Creator);
      assert.equal(proofAcc.farm.toBase58(), farm.publicKey.toBase58());
      assert.equal(
        proofAcc.whitelistedAddress.toBase58(),
        whitelistedCreator.toBase58()
      );
    });



  })

});
