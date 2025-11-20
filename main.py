# main.py
import os
import asyncio
from dotenv import load_dotenv
from discord.ext import commands
from discord import Intents, Bot

# ---- Load environment variables ----
load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
PORT = int(os.getenv("PORT", 8080))

if not TOKEN:
    raise RuntimeError("DISCORD_BOT_TOKEN not set in .env")

# ---- Intents ----
intents = Intents.all()
bot = Bot(intents=intents)  # Slash commands only

# ---- Import modules ----
from verification import VerificationPanelView, VerificationTicketView
from persistent_views import register_persistent_views
from webserver import start as start_webserver

from leaderboard import setup as setup_leaderboard
from tickets import setup as setup_tickets
from point_commands import setup as setup_points
from info_uzvicnik import setup as setup_info

# ---- Async main ----
async def main():
    # ---- Load Cogs ----
    # Leaderboard, tickets, points: currently all sync, no need to await
    setup_leaderboard(bot)
    setup_tickets(bot)
    setup_points(bot)

    # Info cog: sync
    setup_info(bot)

    # ---- Register persistent views ----
    register_persistent_views(bot)

    # ---- Start webserver (non-blocking) ----
    start_webserver()

    # ---- On ready ----
    @bot.event
    async def on_ready():
        print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")
        print("Bot is ready!")

        # Slash commands sync
        try:
            await bot.tree.sync()
            print("Slash commands synchronized.")
        except Exception as e:
            print("Slash sync error:", e)

    # ---- Start bot ----
    await bot.start(TOKEN)

# ---- Entry point ----
if __name__ == "__main__":
    asyncio.run(main())
