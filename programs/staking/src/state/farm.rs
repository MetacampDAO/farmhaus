use anchor_lang::prelude::*;
use farm_common::errors::ErrorCode;

pub const LATEST_FARM_VERSION: u16 = 0;

#[proc_macros::assert_size(120)] // +6 to make it /8
#[repr(C)]
#[account]
pub struct Farm {
    pub version: u16,

    /// sole control over NFT whitelist, un/locking the vaults, and farm flags
    /// can update itself to another Pubkey
    pub developer: Pubkey,

    /// only NFTs allowed will be those that have EITHER a:
    /// 1) creator from this list3
    pub whitelisted_creators: u32,
    /// OR
    /// 2) mint from this list
    pub whitelisted_mints: u32,

    /// total vault count registered with this farm
    pub vault_count: u64,

    /// reserved for future updates, has to be /8
    _reserved: [u8; 64],
}

impl Farm {
}