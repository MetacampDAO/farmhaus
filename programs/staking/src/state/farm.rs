use anchor_lang::prelude::*;
use farm_common::errors::ErrorCode;

pub const LATEST_FARM_VERSION: u16 = 0;

#[proc_macros::assert_size(120)] // +2 to make it /8
#[repr(C)]
#[account]
pub struct Farm {
    pub version: u16,

    /// sole control over gem whitelist, un/locking the vaults, and farm flags
    /// can update itself to another Pubkey
    pub manager: Pubkey,

    pub flags: u32,

    /// only gems allowed will be those that have EITHER a:
    /// 1) creator from this list
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
    pub fn read_flags(flags: u32) -> Result<FarmFlags> {
        FarmFlags::from_bits(flags).ok_or(error!(ErrorCode::InvalidParameter))
    }

    pub fn reset_flags(&mut self, flags: FarmFlags) {
        self.flags = flags.bits();
    }
}

bitflags::bitflags! {
    pub struct FarmFlags: u32 {
        const FREEZE_VAULTS = 1 << 0;
    }
}
