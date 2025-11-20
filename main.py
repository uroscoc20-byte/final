import discord
from discord.ext import commands

# ---- Import verification module ----
from verification import setup as setup_verification, VerificationPanelView, VerificationTicketView

# ---- Bot intents ----
intents = discord.Intents.all()

# ---- Create bot (slash commands only) ----
bot = commands.Bot(command_prefix=None, intents=intents)  # No text prefix, slash commands only

# ---- Load cogs ----
setup_verification(bot)

# ---- Placeholder for future cogs (tickets, points, etc.) ----
# Example:
# from tickets import setup as setup_tickets
# setup_tickets(bot)

# ---- Persistent views registration ----
@bot.event
async def on_ready():
    # Persistent verification buttons
    bot.add_view(VerificationPanelView(None))
    bot.add_view(VerificationTicketView())

    # Add future persistent views here:
    # bot.add_view(TicketCategoryView())
    # bot.add_view(PointsPanelView())

    # Sync slash commands
    await bot.tree.sync()

    print(f"Bot logged in as {bot.user}")

# ---- Optional: Text command exceptions ----
# Example if you want some old text commands like !proof to work
# @bot.command()
# async def proof(ctx):
#     await ctx.send("Your proof command here")

# ---- Run bot ----
bot.run("YOUR_TOKEN_HERE")
