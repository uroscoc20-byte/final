# main.py
import os
import asyncio
from dotenv import load_dotenv
import discord
from discord.ext import commands

# Load env variables
load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
PORT = int(os.getenv("PORT", 8080))

if not TOKEN:
    raise RuntimeError("DISCORD_BOT_TOKEN not set in .env")

intents = discord.Intents.all()
bot = commands.Bot(command_prefix="!", intents=intents)  # prefix ignored, only for exceptions

# --------- Persistent views (leaderboard / verification buttons) ----------
from verification import VerificationPanelView, VerificationModule
from leaderboard import Leaderboard, LeaderboardView
from point_commands import PointsModule

async def register_cogs(bot):
    # --- Load cogs ---
    await bot.add_cog(Leaderboard(bot))
    await bot.add_cog(PointsModule(bot))
    await bot.add_cog(VerificationModule(bot))

# --------- Sync slash commands on ready ----------
@bot.event
async def on_ready():
    print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")
    print("Bot is ready!")
    try:
        await bot.tree.sync()
        print("Slash commands synced.")
    except Exception as e:
        print("Slash sync error:", e)

# --------- Run everything ----------
async def main():
    await register_cogs(bot)

    # Re-register persistent leaderboard & verification buttons
    bot.add_view(LeaderboardView())         # leaderboard pagination
    bot.add_view(VerificationPanelView(None))  # verification panel button

    await bot.start(TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
