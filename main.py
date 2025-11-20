# main.py
import discord
from discord.ext import commands
from leaderboard import Leaderboard, LeaderboardView
from point_commands import PointsModule
from verification import VerificationModule, VerificationPanelView
import os


TOKEN = os.environ.get("DISCORD_TOKEN")  # set your bot token
intents = discord.Intents.all()
bot = commands.Bot(command_prefix="!", intents=intents)


def register_cogs(bot):
    bot.add_cog(Leaderboard(bot))
    bot.add_cog(PointsModule(bot))
    bot.add_cog(VerificationModule(bot))


@bot.event
async def on_ready():
    print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")
    # Register persistent views so buttons survive restarts
    bot.add_view(LeaderboardView())  # leaderboard pagination buttons
    bot.add_view(VerificationPanelView(None))  # verification panel buttons


def main():
    register_cogs(bot)
    bot.run(TOKEN)


if __name__ == "__main__":
    main()
