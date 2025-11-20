# main.py
import os
import discord
from discord.ext import commands

intents = discord.Intents.all()

bot = commands.Bot(command_prefix="!", intents=intents)  # prefix only for exceptions

# ----------------------------
# Load all cogs normally
# ----------------------------
INITIAL_COGS = [
    "verification",
    "tickets",
    "point_commands",
    "leaderboard",
    "info_uzvicnik"
]

@bot.event
async def on_ready():
    # Register global persistent views (only once)
    from verification import VerificationPanelView, VerificationTicketView
    from tickets import TicketPanelView
    from leaderboard import LeaderboardView

    bot.add_view(VerificationPanelView(None))
    bot.add_view(VerificationTicketView())

    bot.add_view(TicketPanelView([
        {"name": "UltraSpeaker Express"},
        {"name": "Ultra Gramiel Express"},
        {"name": "GrimChallenge Express"},
        {"name": "Daily Temple Express"},
        {"name": "Daily 4-Man Express"},
        {"name": "Daily 7-Man Express"},
        {"name": "Weekly Ultra Express"}
    ]))

    bot.add_view(LeaderboardView(current_page=1, per_page=10))

    # Sync slash commands
    await bot.tree.sync()
    print("Slash commands synced.")
    print(f"Logged in as {bot.user}")


async def load_cogs():
    for cog in INITIAL_COGS:
        try:
            await bot.load_extension(cog)
            print(f"Loaded cog: {cog}")
        except Exception as e:
            print(f"Failed to load {cog}: {e}")


async def start_bot():
    await load_cogs()
    TOKEN = os.getenv("DISCORD_BOT_TOKEN")
    await bot.start(TOKEN)


if __name__ == "__main__":
    import asyncio
    asyncio.run(start_bot())
