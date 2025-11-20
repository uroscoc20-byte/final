import os
import discord
from discord.ext import commands

# ---- Import verification module ----
from verification import setup as setup_verification, VerificationPanelView, VerificationTicketView

# ---- Bot intents ----
intents = discord.Intents.all()

# ---- Create bot (slash commands only) ----
bot = commands.Bot(command_prefix=None, intents=intents)  # No text prefix

# ---- Load cogs ----
setup_verification(bot)

# ---- Placeholder for future cogs (tickets, points, leaderboard, etc.) ----
# Example:
# from tickets import setup as setup_tickets
# setup_tickets(bot)

# ---- Persistent views registration ----
@bot.event
async def on_ready():
    # Persistent verification views
    bot.add_view(VerificationPanelView(None))
    bot.add_view(VerificationTicketView())

    # Add future persistent views here:
    # bot.add_view(TicketCategoryView())
    # bot.add_view(PointsPanelView())

    # Sync slash commands globally
    try:
        synced = await bot.tree.sync()
        print(f"Synchronized {len(synced)} slash commands.")
    except Exception as e:
        print("Slash sync error:", e)

    print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")

# ---- Optional: Text command exceptions ----
# Example if you want old text commands like !proof
# @bot.command()
# async def proof(ctx):
#     await ctx.send("Your proof command here")

# ---- Run bot ----
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
if not TOKEN:
    raise RuntimeError("Discord bot token not found in environment variable DISCORD_BOT_TOKEN")

bot.run(TOKEN)
