# main.py
import os
import discord
from discord.ext import commands

# ---- Import your modules ----
from verification import setup as setup_verification, VerificationPanelView, VerificationTicketView
from point_commands import setup as setup_points
from leaderboard import setup as setup_leaderboard  # leaderboard.py with setup() cog
from tickets import setup as setup_tickets
# roles.py has no setup() — we import helpers directly in modules when needed
from utils import generate_ticket_transcript  # utility function
from info_uzvicnik import setup as setup_info
from persistent_views import setup as setup_persistent_views
from webserver import setup as setup_webserver

# ---- Bot intents ----
intents = discord.Intents.all()

# ---- Create bot (slash commands only) ----
bot = commands.Bot(command_prefix=None, intents=intents)  # No text prefix, slash commands only

# ---- Load all modules ----
setup_verification(bot)
setup_points(bot)
setup_leaderboard(bot)
setup_tickets(bot)
setup_info(bot)
setup_persistent_views(bot)
setup_webserver(bot)

# ---- Persistent views registration ----
@bot.event
async def on_ready():
    # Verification persistent views
    bot.add_view(VerificationPanelView(None))
    bot.add_view(VerificationTicketView())

    # If other modules have persistent views, add them here
    # Example:
    # bot.add_view(SomeOtherPersistentView())

    # Sync slash commands globally
    try:
        await bot.tree.sync()
        print("Slash commands synchronized.")
    except Exception as e:
        print("Slash sync error:", e)

    print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")
    print("Bot is ready!")

# ---- Run bot ----
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
if not TOKEN:
    raise RuntimeError("Discord bot token not found in environment variable DISCORD_BOT_TOKEN")

bot.run(TOKEN)
