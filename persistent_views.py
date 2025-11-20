# persistent_views.py
from verification import VerificationPanelView, VerificationTicketView
from tickets import TicketPanelView
from leaderboard import LeaderboardView

def register_persistent_views(bot):
    """
    Register all persistent views on bot startup.
    These views will survive bot restarts and keep buttons functional.
    """

    # --- Verification views ---
    bot.add_view(VerificationPanelView(None))
    bot.add_view(VerificationTicketView())

    # --- Ticket category panel (static) ---
    bot.add_view(TicketPanelView([
        {"name": "UltraSpeaker Express"},
        {"name": "Ultra Gramiel Express"},
        {"name": "GrimChallenge Express"},
        {"name": "Daily Temple Express"},
        {"name": "Daily 4-Man Express"},
        {"name": "Daily 7-Man Express"},
        {"name": "Weekly Ultra Express"}
    ]))

    # --- Leaderboard view (includes refresh button) ---
    bot.add_view(LeaderboardView(current_page=1, per_page=10))
