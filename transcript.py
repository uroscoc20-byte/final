import discord
from datetime import datetime
from io import StringIO

TRANSCRIPT_CHANNEL_ID = 1357314848253542570  # hardcoded destination channel

async def generate_ticket_transcript(ticket_info, rewarded=False, closer_id=None):
    """
    Generates a transcript of a ticket channel and sends it to the hardcoded destination channel.
    """
    channel_id = ticket_info.get("channel_id")
    if not channel_id:
        return

    guild = ticket_info.get("guild")  # optional: pass guild if needed
    if not guild:
        return

    channel = guild.get_channel(channel_id)
    if not channel:
        return

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

    # Fetch messages safely
    try:
        async for msg in channel.history(limit=1000, oldest_first=True):
            transcript_text += f"[{msg.created_at.strftime('%Y-%m-%d %H:%M:%S')}] {msg.author}: {msg.content}\n"
    except Exception:
        transcript_text += "Could not fetch messages from channel.\n"

    # Send transcript as a file
    file = discord.File(StringIO(transcript_text), filename=f"transcript-{channel.name}.txt")
    await destination.send(file=file)
