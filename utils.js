// utils.js - Utility Functions

import { CONFIG } from './config.js';
import { PermissionFlagsBits } from 'discord.js';

// Check if user has admin or staff role
export function isAdminOrStaff(member) {
  const adminRoleId = CONFIG.ROLES.ADMIN;
  const staffRoleId = CONFIG.ROLES.STAFF;
  
  return member.roles.cache.has(adminRoleId) || member.roles.cache.has(staffRoleId);
}

// Generate random room number
export function generateRoomNumber() {
  return Math.floor(Math.random() * 90000) + 10000; // 10000-99999
}

// Generate join commands based on category and bosses
export function generateJoinCommands(category, selectedBosses, roomNumber) {
  const commands = [];

  if (category === 'Daily 4-Man Express') {
    selectedBosses.forEach(boss => {
      commands.push(`\`/join ${boss}-${roomNumber}\``);
    });
  } else if (category === 'Daily 7-Man Express') {
    selectedBosses.forEach(boss => {
      const bossCommands = CONFIG.BOSS_7MAN_COMMANDS[boss] || [boss];
      bossCommands.forEach(cmd => {
        commands.push(`\`/join ${cmd}-${roomNumber}\``);
      });
    });
  } else if (category === 'Weekly Ultra Express') {
    selectedBosses.forEach(boss => {
      commands.push(`\`/join ${boss}-${roomNumber}\``);
    });
  } else if (category === 'UltraSpeaker Express') {
    commands.push(`\`/join UltraSpeaker-${roomNumber}\``);
  } else if (category === 'Ultra Gramiel Express') {
    commands.push(`\`/join UltraGramiel-${roomNumber}\``);
  } else if (category === 'GrimChallenge Express') {
    commands.push(`\`/join Mechabinky-${roomNumber}\``);
    commands.push(`\`/join Raxborg-${roomNumber}\``);
  } else if (category === 'Daily Temple Express') {
    commands.push(`\`/join TempleShrine-${roomNumber}\``);
  }

  return commands.join('\n');
}

// Create ticket embed
export function createTicketEmbed(ticketData) {
  const maxSlots = CONFIG.HELPER_SLOTS[ticketData.category] || 3;
  const points = CONFIG.POINT_VALUES[ticketData.category] || 0;

  const embed = {
    title: `🎫 ${ticketData.category}`,
    color: CONFIG.COLORS.PRIMARY,
    timestamp: new Date().toISOString(),
    fields: [
      {
        name: '📝 Requestor',
        value: `<@${ticketData.requestor_id}>`,
        inline: true
      },
      {
        name: '🎮 In-Game Name',
        value: ticketData.in_game_name || 'N/A',
        inline: true
      },
      {
        name: '🌍 Server',
        value: ticketData.selected_server || 'Unknown',
        inline: true
      }
    ],
    footer: {
      text: `Room: ${ticketData.random_number}`
    }
  };

  // Add selected bosses if applicable
  if (ticketData.selected_bosses && ticketData.selected_bosses.length > 0) {
    const bossesText = ticketData.selected_bosses.map(b => `• ${b}`).join('\n');
    embed.fields.push({
      name: '⚔️ Selected Bosses',
      value: bossesText,
      inline: false
    });
  }

  // Add helpers
  const helpersText = ticketData.helpers.length > 0
    ? ticketData.helpers.map(id => `<@${id}>`).join('\n')
    : '*No helpers yet*';
  
  embed.fields.push({
    name: `✅ Helpers (${ticketData.helpers.length}/${maxSlots})`,
    value: helpersText,
    inline: false
  });

  // Add concerns if any
  if (ticketData.concerns && ticketData.concerns !== 'None') {
    embed.fields.push({
      name: '💬 Concerns',
      value: ticketData.concerns,
      inline: false
    });
  }

  // Add points
  embed.fields.push({
    name: '💰 Points',
    value: `${points.toLocaleString()} per helper`,
    inline: true
  });

  return embed;
}

// Generate transcript from messages
export async function generateTranscript(channel) {
  let transcript = `Ticket Transcript - ${channel.name}\n`;
  transcript += `Generated: ${new Date().toISOString()}\n`;
  transcript += '='.repeat(50) + '\n\n';

  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sortedMessages = Array.from(messages.values()).reverse();

    for (const msg of sortedMessages) {
      const timestamp = msg.createdAt.toISOString();
      transcript += `[${timestamp}] ${msg.author.tag}: ${msg.content}\n`;

      if (msg.attachments.size > 0) {
        msg.attachments.forEach(attachment => {
          transcript += `  📎 Attachment: ${attachment.url}\n`;
        });
      }

      transcript += '\n';
    }
  } catch (error) {
    transcript += `Error generating transcript: ${error.message}\n`;
  }

  return transcript;
}

// Create ticket channel permissions
export function createTicketPermissions(guild, requestorId) {
  const overwrites = [
    {
      id: guild.roles.everyone,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: requestorId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
    },
    {
      id: guild.members.me.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
    }
  ];

  // Add staff/admin permissions
  if (CONFIG.ROLES.ADMIN) {
    overwrites.push({
      id: CONFIG.ROLES.ADMIN,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
    });
  }

  if (CONFIG.ROLES.STAFF) {
    overwrites.push({
      id: CONFIG.ROLES.STAFF,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
    });
  }

  if (CONFIG.ROLES.HELPER) {
    overwrites.push({
      id: CONFIG.ROLES.HELPER,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
    });
  }

  return overwrites;
}