# main.py
import os
import asyncio
from dotenv import load_dotenv
import discord
from discord.ext import commands

# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
PORT = int(os.getenv("PORT", 8080))

if not TOKEN:
    raise RuntimeError("DISCORD_BOT_TOKEN not set in .env")

# Import your modules
from verification import VerificationPanelView, VerificationTicketView
from persistent_views import register_persistent_views
from webserver import start as start_webserver

from leaderboard import setup as setup_leaderboard
from tickets import setup as setup_tickets
from point_commands import setup as setup_points
from info_uzvicnik import setup as setup_info

intents = discord.Intents.all()
bot = commands.Bot(command_prefix=None, intents=intents)  # slash commands only

async def main():
    # ---- Load async cogs ----
    await setup_leaderboard(bot)
    await setup_tickets(bot)
    await setup_points(bot)

    # ---- Load sync cogs ----
    setup_info(bot)

    # ---- Register persistent views ----
    register_persistent_views(bot)

    # ---- Start webserver ----
    start_webserver(PORT)

    # ---- On ready ----
    @bot.event
    async def on_ready():
        print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")
        print("Bot is ready!")
        # Sync slash commands globally
        try:
            await bot.tree.sync()
            print("Slash commands synchronized.")
        except Exception as e:
            print("Slash sync error:", e)

    # ---- Run bot ----
    await bot.start(TOKEN)

# ---- Entry point ----
if __name__ == "__main__":
    asyncio.run(main())
