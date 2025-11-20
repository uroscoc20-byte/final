# utils/transcript.py
import discord
from datetime import datetime
from io import StringIO

TRANSCRIPT_CHANNEL_ID = 1357314848253542570  # hardcoded destination channel

async def generate_ticket_transcript(ticket_info, rewarded=False, closer_id=None):
    """
    Generates a transcript of a ticket channel and sends it to the hardcoded destination channel.
    
    Parameters:
    - ticket_info: dict containing ticket details (requestor, helpers, category, embed_msg, etc.)
    - rewarded: bool, whether helpers were rewarded
    - closer_id: ID of the user who closed the ticket (optional)
    """
    channel = ticket_info.get("embed_msg").channel if ticket_info.get("embed_msg") else None
    if not channel:
        return

    guild = channel.guild
    destination = guild.get_channel(TRANSCRIPT_CHANNEL_ID)
    if not destination:
        return

    transcript_text = f"Ticket Transcript for {ticket_info.get('category', 'Unknown')}\n"
    transcript_text += f"Requestor: <@{ticket_info.get('requestor')}>\n"
    helpers = [f"<@{h}>" for h in ticket_info.get("helpers", []) if h]
    transcript_text += f"Helpers: {', '.join(helpers) if helpers else 'None'}\n"
    transcript_text += f"Opened at: {channel.created_at if channel else 'Unknown'}\n"
    transcript_text += f"Closed at: {datetime.utcnow()}\n"
    transcript_text += f"Rewarded: {'Yes' if rewarded else 'No'}\n"
    if closer_id:
        transcript_text += f"Closed by: <@{closer_id}>\n"
    transcript_text += "\n--- Messages ---\n\n"

    # Fetch last 1000 messages
    try:
        messages = await channel.history(limit=1000, oldest_first=True).flatten()
        for msg in messages:
            transcript_text += f"[{msg.created_at.strftime('%Y-%m-%d %H:%M:%S')}] {msg.author}: {msg.content}\n"
    except Exception:
        transcript_text += "Could not fetch messages from channel.\n"

    # Send transcript as a file
    file = discord.File(StringIO(transcript_text), filename=f"transcript-{channel.name}.txt")
    await destination.send(file=file)
