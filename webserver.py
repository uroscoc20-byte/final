# webserver.py
from flask import Flask
import threading

app = Flask("")


@app.route("/")
def home():
    return "Bot is running!", 200


def run(port: int):
    app.run(host="0.0.0.0", port=port)


def start(port: int = 8080):
    """
    Start the Flask webserver in a separate thread.
    If no port is given, defaults to 8080.
    """
    thread = threading.Thread(target=run, args=(port,))
    thread.daemon = True
    thread.start()


# REQUIRED BY PY-CORD EXTENSION SYSTEM
async def setup(bot):
    """
    Automatically starts the Flask webserver on extension load.
    """
    start()  # will use default port 8080
