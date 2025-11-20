import os
import asyncio
import discord
from discord.ext import commands

from verification import VerificationPanelView, VerificationTicketView
from persistent_views import register_persistent_views
from webserver import start as start_webserver

# Modules with async setup()
from leaderboard import setup as setup_leaderboard
from tickets import setup as setup_tickets
from point_commands import setup as setup_points

# Modules with sync setup()
from info_uzvicnik import setup as setup_info

intents = discord.Intents.all()
bot = commands.Bot(command_prefix=None, intents=intents)  # slash commands only

async def main():
    # ---- Load async modules ----
    await setup_leaderboard(bot)
    await setup_tickets(bot)
    await setup_points(bot)

    # ---- Load sync modules ----
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
        # Sync slash commands globally
        try:
            await bot.tree.sync()
            print("Slash commands synchronized.")
        except Exception as e:
            print("Slash sync error:", e)

    # ---- Run bot ----
    TOKEN = os.getenv("DISCORD_BOT_TOKEN")
    if not TOKEN:
        raise RuntimeError("Discord bot token not found in environment variable DISCORD_BOT_TOKEN")
    await bot.start(TOKEN)

# ---- Entry point ----
asyncio.run(main())
