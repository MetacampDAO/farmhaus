use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct InitFarm<'info> {
    // farm
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<Farm>())]
    pub farm: Box<Account<'info, Farm>>,
    pub developer: Signer<'info>,

    // miscss
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitFarm>) -> Result<()> {
    let farm = &mut ctx.accounts.farm;

    farm.version = LATEST_FARM_VERSION;
    farm.developer = ctx.accounts.developer.key();

    //msg!("farm initialized, version {}", farm.version);
    Ok(())
}
