# utils.py
import discord

async def bot_can_manage_channels(bot, guild):
    """Check if the bot has Manage Channels permission in the guild."""
    return guild.me.guild_permissions.manage_channels

async def generate_ticket_transcript(ticket_info, rewarded=False, closer_id=None, destination=None):
    """
    Send a ticket transcript to a specified channel.
    
    Args:
        ticket_info (dict): Ticket data (requestor, helpers, proof, points, category).
        rewarded (bool): Whether points were rewarded to helpers.
        closer_id (int, optional): User ID of who closed the ticket.
        destination (discord.TextChannel, optional): Channel to send the transcript to.
    """
    if not destination:
        return

    helpers_list = [f"<@{h}>" for h in ticket_info.get("helpers", []) if h]
    if not helpers_list:
        helpers_list = ["None"]

    proof_text = ticket_info.get("proof", "No proof submitted")
    points = ticket_info.get("points", 5)
    
    description_lines = [
        f"**Category:** {ticket_info.get('category', 'Unknown')}",
        f"**Requestor:** <@{ticket_info.get('requestor', 0)}>",
        f"**Helpers:** {', '.join(helpers_list)}",
        f"**Points per helper:** {points}",
        f"**Proof:** {proof_text}",
        f"**Rewarded:** {'Yes' if rewarded else 'No'}"
    ]
    
    if closer_id:
        description_lines.append(f"**Closed by:** <@{closer_id}>")
    
    description = "\n".join(description_lines)

    embed = discord.Embed(title="🎫 Ticket Transcript", description=description, color=0x5865F2)
    await destination.send(embed=embed)
