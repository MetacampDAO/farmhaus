use anchor_lang::prelude::*;
use farm_common::*;

use crate::state::*;

#[derive(Accounts)]
pub struct AddToWhitelist<'info> {
    // farm
    #[account(mut, has_one = developer)]
    pub farm: Box<Account<'info, Farm>>,
    pub developer: Signer<'info>,

    // whitelist
    /// CHECK:
    pub address_to_whitelist: AccountInfo<'info>,
    // must stay init_as_needed, otherwise no way to change afterwards
    #[account(init_if_needed,
        seeds = [
            b"whitelist".as_ref(),
            farm.key().as_ref(),
            address_to_whitelist.key().as_ref(),
        ],
        bump,
        payer = payer,
        space = 8 + std::mem::size_of::<WhitelistProof>())]
    pub whitelist_proof: Box<Account<'info, WhitelistProof>>,

    // misc
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddToWhitelist>, whitelist_type: u8) -> Result<()> {
    // Discriminator check not needed for v0.24.2 and above
    // create/update whitelist proof
    let proof = &mut ctx.accounts.whitelist_proof;

    // if this is an update, decrement counts from existing whitelist
    if proof.whitelist_type > 0 {
        let existing_whitelist = WhitelistProof::read_type(proof.whitelist_type)?;
        let farm = &mut ctx.accounts.farm;

        if existing_whitelist.contains(WhitelistType::CREATOR) {
            farm.whitelisted_creators.try_sub_assign(1)?;
        }
        if existing_whitelist.contains(WhitelistType::MINT) {
            farm.whitelisted_mints.try_sub_assign(1)?;
        }
    }

    // record new whitelist and increment counts
    let new_whitelist = WhitelistProof::read_type(whitelist_type)?;

    proof.reset_type(new_whitelist);
    proof.whitelisted_address = ctx.accounts.address_to_whitelist.key();
    proof.farm = ctx.accounts.farm.key();

    let farm = &mut ctx.accounts.farm;

    if new_whitelist.contains(WhitelistType::CREATOR) {
        farm.whitelisted_creators.try_add_assign(1)?;
    }
    if new_whitelist.contains(WhitelistType::MINT) {
        farm.whitelisted_mints.try_add_assign(1)?;
    }

    // msg!(
    //     "{} added to whitelist",
    //     &ctx.accounts.address_to_whitelist.key()
    // );
    Ok(())
}
