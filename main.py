# main.py
import os
import asyncio
from dotenv import load_dotenv
from discord.ext.commands import Bot
from discord import Intents

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

intents = Intents.all()
bot = Bot(command_prefix="!", intents=intents)  # needs a prefix for commands.Bot

async def main():
    # ---- Load async cogs ----
    # If setup functions are async, await them
    if asyncio.iscoroutinefunction(setup_leaderboard):
        await setup_leaderboard(bot)
    else:
        setup_leaderboard(bot)

    if asyncio.iscoroutinefunction(setup_tickets):
        await setup_tickets(bot)
    else:
        setup_tickets(bot)

    if asyncio.iscoroutinefunction(setup_points):
        await setup_points(bot)
    else:
        setup_points(bot)

    # ---- Load sync cog ----
    setup_info(bot)

    # ---- Register persistent views ----
    register_persistent_views(bot)

    # ---- Start webserver ----
    start_webserver()

    # ---- On ready ----
    @bot.event
    async def on_ready():
        print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")
        print("Bot is ready!")
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
