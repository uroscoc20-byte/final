# info_uzvicnik.py
import discord
from discord.ext import commands

# Hardcoded texts/images for the commands
HARDCODED_COMMANDS = {
    "proof": {
        "text": "Attach your proof here (screenshot, video, logs).",
        "image": None,
    },
    "rrules": {
        "text": "Runner rules will be posted here.",
        "image": None,
    },
    "hrules": {
        "text": "Helper rules will be posted here.",
        "image": None,
    },
}

class CustomHardcodedModule(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    def get_content(self, name: str):
        return HARDCODED_COMMANDS.get(name, {"text": "Not configured.", "image": None})

    @commands.slash_command(name="proof", description="Show proof instructions")
    async def proof(self, ctx: discord.ApplicationContext):
        data = self.get_content("proof")
        embed = discord.Embed(title="!proof", description=data["text"], color=0xFFD700)
        if data["image"]:
            embed.set_image(url=data["image"])
        await ctx.respond(embed=embed)

    @commands.slash_command(name="rrules", description="Show runner rules")
    async def rrules(self, ctx: discord.ApplicationContext):
        data = self.get_content("rrules")
        embed = discord.Embed(title="!rrules", description=data["text"], color=0xFFD700)
        if data["image"]:
            embed.set_image(url=data["image"])
        await ctx.respond(embed=embed)

    @commands.slash_command(name="hrules", description="Show helper rules")
    async def hrules(self, ctx: discord.ApplicationContext):
        data = self.get_content("hrules")
        embed = discord.Embed(title="!hrules", description=data["text"], color=0xFFD700)
        if data["image"]:
            embed.set_image(url=data["image"])
        await ctx.respond(embed=embed)

    @commands.slash_command(name="info", description="Show all important commands and info")
    async def info(self, ctx: discord.ApplicationContext):
        embed = discord.Embed(
            title="✨ Server Commands & Info",
            description="All important commands available on this server.",
            color=0x5865F2,
        )

        # Hardcoded sections, adjust as needed
        embed.add_field(
            name="🎫 Ticket Commands",
            value=(
                "`/panel` — Post ticket panel (admin/staff)\n"
                "`/verification_panel` — Post verification panel (admin/staff)\n"
                "`/ticket_kick @user` — Remove from ticket embed"
            ),
            inline=False,
        )

        embed.add_field(
            name="📊 Points & Leaderboard",
            value=(
                "`/leaderboard [page]` — View top helpers\n"
                "`/points [user]` — Check points\n"
                "`/points_add @user amount` — Add points (admin)\n"
                "`/points_remove @user amount` — Remove points (admin)\n"
                "`/points_set @user amount` — Set exact points (admin)\n"
                "`/points_remove_user @user` — Remove from leaderboard (admin)\n"
                "`/points_reset` — Reset leaderboard (admin)"
            ),
            inline=False,
        )

        embed.add_field(
            name="⚙️ Hardcoded Text Commands",
            value="`/proof`, `/rrules`, `/hrules` — Displays configured messages.",
            inline=False,
        )

        await ctx.respond(embed=embed)

def setup(bot):
    bot.add_cog(CustomHardcodedModule(bot))
