# config.py

# ---------------- HELPER SLOTS ----------------
# Number of helpers allowed per ticket category
DEFAULT_HELPER_SLOTS = {
    "GrimChallenge Express": 6,
    "Daily 7-Man Express": 6,
    "Weekly Ultra Express": 6,
    # All other categories default to 3
    "UltraSpeaker Express": 3,
    "Ultra Gramiel Express": 3,
    "Daily 4-Man Express": 3,
    "Daily Temple Express": 3,
}

# ---------------- POINT VALUES ----------------
# Points rewarded to each helper per category
DEFAULT_POINT_VALUES = {
    "GrimChallenge Express": 10,
    "UltraSpeaker Express": 8,
    "Weekly Ultra Express": 12,
    "Daily 7-Man Express": 10,
    "Daily 4-Man Express": 4,
    "Daily Temple Express": 6,
    "Ultra Gramiel Express": 7,
}

