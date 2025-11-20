# roles.py

# ---------------- ROLE IDs ----------------
ADMIN_ROLE_ID = 1345073680610496602
STAFF_ROLE_ID = 1374821509268373686
HELPER_ROLE_ID = 1392803882115010734
RESTRICTED_ROLE_ID = 1405930080256921732

# ---------------- PERMISSION HELPERS ----------------
def is_admin(member: "discord.Member") -> bool:
    """Check if member is admin (role or guild admin)."""
    return member.guild_permissions.administrator or ADMIN_ROLE_ID in [r.id for r in member.roles]

def is_staff(member: "discord.Member") -> bool:
    """Check if member is staff (role or admin)."""
    return is_admin(member) or STAFF_ROLE_ID in [r.id for r in member.roles]

def is_helper(member: "discord.Member") -> bool:
    """Check if member is helper."""
    return HELPER_ROLE_ID in [r.id for r in member.roles]

def is_restricted(member: "discord.Member") -> bool:
    """Check if member is restricted."""
    return RESTRICTED_ROLE_ID in [r.id for r in member.roles]
