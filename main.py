# main.py
import os
import discord
from discord.ext import commands

# ------ BOT SETUP ------
intents = discord.Intents.all()
bot = commands.Bot(intents=intents)   # No prefix → slash-only bot

# ------ LOAD EXTENSIONS ------
EXTENSIONS = [
    "verification",
    "tickets",
    "point_commands",
    "leaderboard",
    "info_uzvicnik",
    "persistent_views",
    "webserver"
]

@bot.event
async def on_ready():
    print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")
    print("Bot is ready!")

async def load_extensions():
    for ext in EXTENSIONS:
        try:
            await bot.load_extension(ext)
            print(f"Loaded {ext}")
        except Exception as e:
            print(f"Failed to load {ext}: {e}")

async def main():
    async with bot:
        await load_extensions()
        await bot.start(os.getenv("DISCORD_BOT_TOKEN"))

import asyncio
asyncio.run(main())
