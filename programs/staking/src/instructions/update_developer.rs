use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct UpdateDeveloper<'info> {
    // farm
    #[account(mut, has_one = developer)]
    pub farm: Box<Account<'info, Farm>>,
    pub developer: Signer<'info>,
    /// CHECK:
    pub new_developer: AccountInfo<'info>
}

pub fn handler(ctx: Context<UpdateDeveloper>) -> Result<()> {
    let farm = &mut ctx.accounts.farm;

    farm.developer = *ctx.accounts.new_developer.key;

    //msg!("farm developer updated to: {}", new_developer);
    Ok(())
}
