use anchor_lang::prelude::*;
use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod instructions;
pub mod state;

#[program]
pub mod farm {
    use super::*;

    pub fn init_farm(ctx: Context<InitFarm>) -> Result<()> {
        instructions::init_farm::handler(ctx)
    }

    pub fn update_developer(ctx: Context<UpdateDeveloper>) -> Result<()> {
        instructions::update_developer::handler(ctx)
    }
}
