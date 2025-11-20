# webserver.py
from flask import Flask
import os
import threading

app = Flask("")


@app.route("/")
def home():
    return "Bot is running!", 200


def run():
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)


def start():
    thread = threading.Thread(target=run)
    thread.daemon = True
    thread.start()


# REQUIRED BY PY-CORD EXTENSION SYSTEM
async def setup(bot):
    """
    Automatically starts the Flask webserver on extension load.
    """
    start()
