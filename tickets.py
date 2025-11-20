import re
import discord
from discord.ext import commands
from discord.ui import View, Button, Modal, InputText
import random
from roles import is_admin, is_staff, is_helper, is_restricted
from utils import bot_can_manage_channels, generate_ticket_transcript
from config import DEFAULT_HELPER_SLOTS, DEFAULT_POINT_VALUES

# Active tickets
active_tickets = {}

# ---------------- BOSS SELECTION ----------------
DAILY_4MAN_BOSSES = [
    "UltraEzrajal", "UltraWarden", "UltraEngineer",
    "UltraTyndarius", "UltraDage", "UltraIara", "UltraKala"
]

DAILY_7MAN_BOSSES = {
    "Astralshrine": ["Astralshrine"],
    "KathoolDepths": ["KathoolDepths"],
    "Originul": ["VoidFlibbi", "VoidNightbane", "VoidXyfrag"],
    "ApexAzalith": ["ApexAzalith"],
    "Lich Lord/Beast/Deimos": ["LichLord"],
    "Lavarockshore": ["Lavarockshore"]
}

WEEKLY_ULTRA_BOSSES = [
    "UltraDarkon", "ChampionDrakath", "UltraDage", "UltraNulgath", "UltraDrago"
]

CATEGORY_CHANNEL_PREFIX = {
    "UltraSpeaker Express": "UltraSpeaker",
    "Ultra Gramiel Express": "UltraGramiel",
    "GrimChallenge Express": "GrimChallenge",
    "Daily Temple Express": "TempleShrine",
    "Daily 4-Man Express": "4Man",
    "Daily 7-Man Express": "7Man",
    "Weekly Ultra Express": "Weekly"
}

# ---------------- PANEL VIEW ----------------
class TicketPanelView(View):
    def __init__(self, categories):
        super().__init__(timeout=None)
        for cat in categories[:25]:
            name = re.sub(r"^\d+\.\s*", "", cat["name"])
            custom_id = f"open_ticket::{name}"
            self.add_item(Button(
                label=name,
                style=discord.ButtonStyle.secondary,
                custom_id=custom_id,
                emoji="<:URE:1429522388395233331>"
            ))

# ---------------- TICKET MODAL ----------------
class TicketModal(Modal):
    def __init__(self, category_name):
        super().__init__(title=f"{category_name} Ticket")
        self.category_name = category_name
        self.add_item(InputText(label="In-game name?", required=True))
        self.add_item(InputText(label="Any concerns?", required=False))

    async def callback(self, interaction: discord.Interaction):
        in_game = self.children[0].value
        concerns = self.children[1].value or "—"

        # Random number for /join commands
        number = random.randint(1000, 99999)
        prefix = CATEGORY_CHANNEL_PREFIX.get(self.category_name, "ticket")
        channel_name = f"join-{prefix}-{number}"

        # Channel permissions
        overwrites = {
            interaction.guild.default_role: discord.PermissionOverwrite(view_channel=False),
            interaction.user: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)
        }

        ch = await interaction.guild.create_text_channel(
            name=channel_name,
            overwrites=overwrites,
            reason=f"Ticket for {interaction.user}"
        )

        # Ticket embed
        embed = discord.Embed(
            title=f"{self.category_name} Ticket",
            description=f"Requester: {interaction.user.mention}\n**In-game name:** {in_game}\n**Concerns:** {concerns}",
            color=0x5865F2
        )

        # Add bosses and /join numbers
        if self.category_name == "Daily 4-Man Express":
            for boss in DAILY_4MAN_BOSSES:
                embed.add_field(name=boss, value=f"/join {boss}-{number}", inline=False)
        elif self.category_name == "Daily 7-Man Express":
            for boss, cmds in DAILY_7MAN_BOSSES.items():
                for cmd in cmds:
                    embed.add_field(name=boss, value=f"/join {cmd}-{number}", inline=False)
        elif self.category_name == "Weekly Ultra Express":
            for boss in WEEKLY_ULTRA_BOSSES:
                embed.add_field(name=boss, value=f"/join {boss}-{number}", inline=False)

        # Create ticket buttons view
        view = TicketActionView(interaction.user.id)

        await ch.send(embed=embed, view=view)

        # Store ticket info
        slots = DEFAULT_HELPER_SLOTS.get(self.category_name, 1)
        points = DEFAULT_POINT_VALUES.get(self.category_name, 5)
        active_tickets[ch.id] = {
            "category": self.category_name,
            "requestor": interaction.user.id,
            "helpers": [None] * slots,
            "points": points,
            "channel_id": ch.id,
            "random_number": number,
            "proof_submitted": False
        }

        await interaction.response.send_message(f"✅ Ticket created: {ch.mention}", ephemeral=True)

# ---------------- TICKET BUTTONS VIEW ----------------
class TicketActionView(View):
    def __init__(self, requestor_id):
        super().__init__(timeout=None)
        self.requestor_id = requestor_id
        self.add_item(JoinButton())
        self.add_item(SubmitProofButton(requestor_id))
        self.add_item(CloseTicketButton(requestor_id, disabled=True))  # starts disabled

class JoinButton(Button):
    def __init__(self):
        super().__init__(label="Join Ticket", style=discord.ButtonStyle.green, custom_id="join_ticket")

    async def callback(self, interaction: discord.Interaction):
        ticket_info = active_tickets.get(interaction.channel.id)
        if not ticket_info:
            await interaction.response.send_message("No active ticket found.", ephemeral=True)
            return
        if interaction.user.id == ticket_info["requestor"]:
            await interaction.response.send_message("You cannot join your own ticket.", ephemeral=True)
            return
        if interaction.user.id in [h for h in ticket_info["helpers"] if h]:
            await interaction.response.send_message("You are already helping this ticket.", ephemeral=True)
            return

        # Add helper to first empty slot
        for i in range(len(ticket_info["helpers"])):
            if ticket_info["helpers"][i] is None:
                ticket_info["helpers"][i] = interaction.user.id
                break

        try:
            await interaction.channel.set_permissions(interaction.user, view_channel=True, send_messages=True)
        except Exception:
            pass

        await interaction.response.send_message("✅ You joined the ticket.", ephemeral=True)

class SubmitProofButton(Button):
    def __init__(self, requestor_id):
        super().__init__(label="Submit Proof", style=discord.ButtonStyle.blurple, custom_id="submit_proof")
        self.requestor_id = requestor_id

    async def callback(self, interaction: discord.Interaction):
        if interaction.user.id != self.requestor_id:
            await interaction.response.send_message("Only the requestor can submit proof.", ephemeral=True)
            return

        ticket_info = active_tickets.get(interaction.channel.id)
        if ticket_info["proof_submitted"]:
            await interaction.response.send_message("Proof already submitted.", ephemeral=True)
            return

        await interaction.response.send_modal(ProofModal(interaction.channel.id))

# ---------------- CLOSE TICKET ----------------
class CloseTicketButton(Button):
    def __init__(self, requestor_id, disabled=True):  # starts disabled
        super().__init__(label="Close Ticket", style=discord.ButtonStyle.red, custom_id="close_ticket", disabled=disabled)
        self.requestor_id = requestor_id

    async def callback(self, interaction: discord.Interaction):
        ticket_info = active_tickets.get(interaction.channel.id)
        if not ticket_info:
            await interaction.response.send_message("No active ticket found.", ephemeral=True)
            return

        if interaction.user.id == ticket_info["requestor"] and not ticket_info.get("proof_submitted", False):
            await interaction.response.send_message(
                "You must submit proof before closing the ticket.",
                ephemeral=True
            )
            return

        if not (interaction.user.id == ticket_info["requestor"] or is_staff(interaction.user) or is_admin(interaction.user)):
            await interaction.response.send_message("Only staff/admin or requestor can close this ticket.", ephemeral=True)
            return

        # Remove helpers/requestor permissions
        for user_id in ticket_info["helpers"] + [ticket_info["requestor"]]:
            if user_id:
                member = interaction.guild.get_member(user_id)
                if member:
                    try:
                        await interaction.channel.set_permissions(member, view_channel=False, send_messages=False)
                    except Exception:
                        pass

        # Reward helpers
        points = ticket_info.get("points", 5)
        for helper_id in ticket_info["helpers"]:
            if helper_id:
                current = await db.get_points(helper_id)
                await db.set_points(helper_id, current + points)

# Generate transcript
transcript_channel = interaction.guild.get_channel(1357314848253542570)
if transcript_channel:
    await generate_ticket_transcript(
        ticket_info, 
        rewarded=True, 
        closer_id=interaction.user.id, 
        destination=transcript_channel
    )

# Replace embed with closed ticket embed + Delete button
embed = discord.Embed(
    title=f"{ticket_info['category']} Ticket (Closed)",
    description="Ticket closed. Only staff/admin can delete this channel.",
    color=0x5865F2
)
view = DeleteTicketView(interaction.channel.id)
await interaction.channel.send(embed=embed, view=view)

# Remove ticket from active list
active_tickets.pop(interaction.channel.id, None)

# ---------------- DELETE BUTTON ----------------
class DeleteTicketView(View):
    def __init__(self, channel_id):
        super().__init__(timeout=None)
        self.channel_id = channel_id
        self.add_item(DeleteTicketButton())

class DeleteTicketButton(Button):
    def __init__(self):
        super().__init__(label="Delete Ticket", style=discord.ButtonStyle.danger, custom_id="delete_ticket")

    async def callback(self, interaction: discord.Interaction):
        if not (is_staff(interaction.user) or is_admin(interaction.user)):
            await interaction.response.send_message("Only staff/admin can delete this channel.", ephemeral=True)
            return
        try:
            await interaction.channel.delete(reason=f"Ticket deleted by {interaction.user}")
        except Exception:
            pass

# ---------------- PROOF MODAL ----------------
class ProofModal(Modal):
    def __init__(self, channel_id):
        super().__init__(title="Submit Proof")
        self.channel_id = channel_id
        self.add_item(InputText(label="Proof URL or Description", required=False))
        self.add_item(InputText(label="Description (optional)", required=False))

    async def callback(self, interaction: discord.Interaction):
        ticket_info = active_tickets.get(self.channel_id)
        if not ticket_info:
            await interaction.response.send_message("Ticket not found.", ephemeral=True)
            return

        ticket_info["proof_submitted"] = True

        proof_url = self.children[0].value or None
        description = self.children[1].value or "—"
        ticket_info["proof"] = proof_url or description

        # Send proof to fixed channel
        proof_channel = interaction.guild.get_channel(1357332638838558862)
        if proof_channel:
            if proof_url:
                embed = discord.Embed(title="Submitted Proof", description=description, color=0x5865F2)
                embed.set_image(url=proof_url)
                await proof_channel.send(content=f"**Proof submitted by:** {interaction.user.mention}", embed=embed)
            else:
                await proof_channel.send(f"**Proof submitted by:** {interaction.user.mention}\n**Description:** {description}")

        # Reactivate Close button
        for child in interaction.message.components[0].children:
            if child.custom_id == "close_ticket":
                child.disabled = False
        await interaction.message.edit(view=interaction.message.components)

        await interaction.response.send_message(
            "✅ Proof submitted successfully. You can now close the ticket.",
            ephemeral=True
        )

# ---------------- TICKET COG ----------------
class TicketModule(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.slash_command(name="panel", description="Deploy ticket panel (staff/admin only)")
    async def panel(self, ctx: discord.ApplicationContext):
        if not (is_staff(ctx.user) or is_admin(ctx.user)):
            await ctx.respond("You don't have permission to deploy ticket panel.", ephemeral=True)
            return

        if not ctx.guild.me.guild_permissions.manage_channels:
            await ctx.respond("I need Manage Channels permission to create ticket channels.", ephemeral=True)
            return

        categories = [
            {"name": "UltraSpeaker Express"},
            {"name": "Ultra Gramiel Express"},
            {"name": "GrimChallenge Express"},
            {"name": "Daily Temple Express"},
            {"name": "Daily 4-Man Express"},
            {"name": "Daily 7-Man Express"},
            {"name": "Weekly Ultra Express"}
        ]
        view = TicketPanelView(categories)
        embed = discord.Embed(
            title="🎮 IN-GAME ASSISTANCE 🎮",
            description="Select a service below to create a help ticket.",
            color=0x5865F2
        )
        await ctx.respond(embed=embed, view=view)

@commands.slash_command(name="ticket_kick", description="Remove a helper from the ticket (staff/admin only)")
async def ticket_kick(
    self,
    ctx: discord.ApplicationContext,
    member: discord.Option(discord.Member, "Select the helper to remove")
):
    # Check permissions
    if not (is_staff(ctx.user) or is_admin(ctx.user)):
        await ctx.respond("Only staff/admin can remove helpers.", ephemeral=True)
        return

    ticket_info = active_tickets.get(ctx.channel.id)
    if not ticket_info:
        await ctx.respond("This channel is not an active ticket.", ephemeral=True)
        return

    if member.id not in ticket_info["helpers"]:
        await ctx.respond(f"{member.mention} is not a helper in this ticket.", ephemeral=True)
        return

    # Remove from helpers list
    ticket_info["helpers"] = [h if h != member.id else None for h in ticket_info["helpers"]]

    # Revoke permissions
    try:
        await ctx.channel.set_permissions(member, overwrite=None)
    except Exception:
        pass

    # Update ticket embed
    for msg in await ctx.channel.history(limit=20).flatten():  # look for ticket embed
        if msg.embeds:
            embed = msg.embeds[0]
            if "Helpers:" in embed.description:
                helpers = [h for h in ticket_info["helpers"] if h]
                helpers_text = ", ".join(f"<@{h}>" for h in helpers) if helpers else "None"
                lines = embed.description.splitlines()
                for i, line in enumerate(lines):
                    if line.startswith("Helpers:"):
                        lines[i] = f"Helpers: {helpers_text}"
                embed.description = "\n".join(lines)
                await msg.edit(embed=embed)
                break

    await ctx.respond(f"✅ {member.mention} has been removed from this ticket.", ephemeral=True)


def setup(bot):
    bot.add_cog(TicketModule(bot))

