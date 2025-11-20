import discord
from discord.ext import commands
from database import db  # make sure this module exists

ACCENT = 0x5865F2

class PointsModule(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @staticmethod
    async def reward_ticket_helpers(ticket_info):
        """Reward all helpers of a ticket safely."""
        helpers = [h for h in ticket_info.get("helpers", []) if h]
        category = ticket_info.get("category", "Unknown")
        points = ticket_info.get("points", 10)
        channel = ticket_info.get("embed_msg")  # optional: send reward message here

        for uid in helpers:
            try:
                current = await db.get_points(uid)
                await db.set_points(uid, current + points)
            except Exception as e:
                print(f"[PointsModule] Failed to reward user {uid}: {e}")

        if channel:
            try:
                await channel.send(f"✅ Helpers have been rewarded for **{category}** ticket!")
            except Exception:
                pass

    # ----------------- USER COMMANDS -----------------
    @commands.slash_command(name="points", description="Check your points or another user's points")
    async def points(
        self,
        ctx: discord.ApplicationContext,
        user: discord.Option(discord.User, "Select a user", required=False),
    ):
        target = user or ctx.user
        try:
            pts = await db.get_points(target.id)
        except Exception:
            pts = 0

        avatar = target.display_avatar.url if target.display_avatar else None
        embed = discord.Embed(
            title=f"🏅 Points for {target.display_name}",
            description=f"**{pts} points**",
            color=ACCENT
        )
        if avatar:
            embed.set_thumbnail(url=avatar)
        embed.set_footer(text="Use /leaderboard to view rankings")
        await ctx.respond(embed=embed)

    # ----------------- ADMIN COMMANDS -----------------
    def _check_admin(self, ctx):
        if not ctx.user.guild_permissions.administrator:
            raise commands.CheckFailure("You do not have permission.")

    @commands.slash_command(name="points_reset", description="Reset all points (Admin only)")
    async def points_reset(self, ctx: discord.ApplicationContext):
        try:
            self._check_admin(ctx)
            await db.reset_points()
            await ctx.respond("✅ All points have been reset!")
        except commands.CheckFailure as e:
            await ctx.respond(str(e), ephemeral=True)

    @commands.slash_command(name="points_add", description="Add points to a user (Admin only)")
    async def points_add(
        self,
        ctx: discord.ApplicationContext,
        user: discord.Option(discord.User, "User"),
        amount: discord.Option(int, "Amount"),
    ):
        try:
            self._check_admin(ctx)
        except commands.CheckFailure as e:
            await ctx.respond(str(e), ephemeral=True)
            return

        if amount <= 0:
            await ctx.respond("Amount must be positive.", ephemeral=True)
            return

        try:
            current = await db.get_points(user.id)
            await db.set_points(user.id, current + amount)
            await ctx.respond(f"✅ Added {amount} points to {user.mention}.")
        except Exception:
            await ctx.respond("Failed to update points.", ephemeral=True)

    @commands.slash_command(name="points_remove", description="Remove points from a user (Admin only)")
    async def points_remove(
        self,
        ctx: discord.ApplicationContext,
        user: discord.Option(discord.User, "User"),
        amount: discord.Option(int, "Amount"),
    ):
        try:
            self._check_admin(ctx)
        except commands.CheckFailure as e:
            await ctx.respond(str(e), ephemeral=True)
            return

        if amount <= 0:
            await ctx.respond("Amount must be positive.", ephemeral=True)
            return

        try:
            current = await db.get_points(user.id)
            await db.set_points(user.id, max(0, current - amount))
            await ctx.respond(f"✅ Removed {amount} points from {user.mention}.")
        except Exception:
            await ctx.respond("Failed to update points.", ephemeral=True)

    @commands.slash_command(name="points_set", description="Set user's points to exact value (Admin only)")
    async def points_set(
        self,
        ctx: discord.ApplicationContext,
        user: discord.Option(discord.User, "User"),
        amount: discord.Option(int, "Amount"),
    ):
        try:
            self._check_admin(ctx)
        except commands.CheckFailure as e:
            await ctx.respond(str(e), ephemeral=True)
            return

        if amount < 0:
            await ctx.respond("Amount cannot be negative.", ephemeral=True)
            return

        try:
            await db.set_points(user.id, amount)
            await ctx.respond(f"✅ Set {user.mention}'s points to {amount}.")
        except Exception:
            await ctx.respond("Failed to update points.", ephemeral=True)

    @commands.slash_command(name="points_remove_user", description="Remove a user from leaderboard (Admin only)")
    async def points_remove_user(
        self,
        ctx: discord.ApplicationContext,
        user: discord.Option(discord.User, "User"),
    ):
        try:
            self._check_admin(ctx)
        except commands.CheckFailure as e:
            await ctx.respond(str(e), ephemeral=True)
            return

        try:
            await db.delete_user_points(user.id)
            await ctx.respond(f"✅ Removed {user.mention} from the leaderboard.")
        except Exception:
            await ctx.respond("Failed to remove user.", ephemeral=True)


# ----------------- SETUP FUNCTION -----------------
def setup(bot: commands.Bot):
    """This is called to add the cog. Do NOT await it in main.py"""
    bot.add_cog(PointsModule(bot))
