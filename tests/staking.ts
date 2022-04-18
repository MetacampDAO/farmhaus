import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FarmClient } from '../src/farm';

describe('farm', () => {
  // Configure the client to use the local cluster.
  const _provider = anchor.AnchorProvider.env();
  const gb = new FarmClient(_provider.connection, _provider.wallet as any);

  
});
