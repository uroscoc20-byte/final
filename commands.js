// commands.js - Slash Commands

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits 
} from 'discord.js';
import { CONFIG } from './config.js';
import { isAdminOrStaff } from './utils.js';
import { 
  createTicketPanelButtons 
} from './tickets.js';

export const commands = [];

// ========== PANEL COMMAND ==========
const panelCommand = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Post the ticket panel (Admin/Staff only)');

commands.push({
  data: panelCommand,
  async execute(interaction, db) {
    // Check permissions
    if (!isAdminOrStaff(interaction.member)) {
      return await interaction.reply({
        content: '❌ You don\'t have permission to use this command.',
        ephemeral: true
      });
    }

    // Create panel embed
    let description = 'Click a button below to request help with bosses!\n\n**Rules:**\n';
    description += '• Use `/rrules` to view requestor rules\n';
    description += '• Use `/hrules` to view helper rules\n';
    description += '• Use `/proof` to see proof requirements\n\n';
    description += '**Point Values:**\n';

    CONFIG.CATEGORIES.forEach(cat => {
      const points = CONFIG.POINT_VALUES[cat] || 0;
      description += `• **${cat.replace(' Express', '')}**: ${points} pts\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🎫 Helper Ticket Panel')
      .setDescription(description)
      .setColor(CONFIG.COLORS.PRIMARY);

    const buttons = createTicketPanelButtons();

    await interaction.channel.send({
      embeds: [embed],
      components: buttons
    });

    await interaction.reply({
      content: '✅ Ticket panel posted!',
      ephemeral: true
    });
  }
});

// ========== RRULES COMMAND ==========
const rrulesCommand = new SlashCommandBuilder()
  .setName('rrules')
  .setDescription('Show requestor rules');

commands.push({
  data: rrulesCommand,
  async execute(interaction, db) {
    const embed = new EmbedBuilder()
      .setDescription(CONFIG.HARDCODED_COMMANDS.rrules.text)
      .setColor(CONFIG.COLORS.PRIMARY);

    await interaction.reply({ embeds: [embed] });
  }
});

// ========== HRULES COMMAND ==========
const hrulesCommand = new SlashCommandBuilder()
  .setName('hrules')
  .setDescription('Show helper rules');

commands.push({
  data: hrulesCommand,
  async execute(interaction, db) {
    const embed = new EmbedBuilder()
      .setDescription(CONFIG.HARDCODED_COMMANDS.hrules.text)
      .setColor(CONFIG.COLORS.PRIMARY);

    await interaction.reply({ embeds: [embed] });
  }
});

// ========== PROOF COMMAND ==========
const proofCommand = new SlashCommandBuilder()
  .setName('proof')
  .setDescription('Show proof requirements');

commands.push({
  data: proofCommand,
  async execute(interaction, db) {
    const embed = new EmbedBuilder()
      .setDescription(CONFIG.HARDCODED_COMMANDS.proof.text)
      .setColor(CONFIG.COLORS.PRIMARY);

    if (CONFIG.HARDCODED_COMMANDS.proof.image) {
      embed.setImage(CONFIG.HARDCODED_COMMANDS.proof.image);
    }

    await interaction.reply({ embeds: [embed] });
  }
});

// ========== LEADERBOARD COMMAND ==========
const leaderboardCommand = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Show the helper leaderboard');

commands.push({
  data: leaderboardCommand,
  async execute(interaction, db) {
    const leaderboard = db.getLeaderboard(CONFIG.LEADERBOARD_PER_PAGE);

    const topEmojis = ['🥇', '🥈', '🥉'];
    const lines = [];

    leaderboard.forEach((entry, index) => {
      const rank = index + 1;
      const userId = entry.user_id;
      const points = entry.points;

      if (rank <= 3) {
        lines.push(`${topEmojis[rank - 1]} <@${userId}>`);
        lines.push(`**└ ${points.toLocaleString()} points**`);
      } else {
        lines.push(`**#${rank}** <@${userId}>`);
        lines.push(`**└ ${points.toLocaleString()} points**`);
      }
    });

    const description = lines.length > 0 ? lines.join('\n') : '*No entries yet.*';

    const embed = new EmbedBuilder()
      .setTitle('🏆 HELPER\'S LEADERBOARD SEASON 8')
      .setDescription(description)
      .setColor(CONFIG.COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: `📄 Page 1/1` });

    await interaction.reply({ embeds: [embed] });
  }
});

// ========== POINTS COMMAND ==========
const pointsCommand = new SlashCommandBuilder()
  .setName('points')
  .setDescription('Check your points or another user\'s points')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('User to check points for (optional)')
      .setRequired(false)
  );

commands.push({
  data: pointsCommand,
  async execute(interaction, db) {
    const target = interaction.options.getUser('user') || interaction.user;
    const points = db.getPoints(target.id);

    // Get rank
    const leaderboard = db.getLeaderboard(1000);
    let rank = null;
    for (let i = 0; i < leaderboard.length; i++) {
      if (leaderboard[i].user_id === target.id) {
        rank = i + 1;
        break;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Helper Points')
      .setColor(CONFIG.COLORS.PRIMARY)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${target}`, inline: false },
        { name: 'Points', value: `**${points.toLocaleString()}**`, inline: true },
        { name: 'Rank', value: rank ? `**#${rank}**` : '*Unranked*', inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  }
});

// ========== INFO COMMAND ==========
const infoCommand = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Show all important commands and info');

commands.push({
  data: infoCommand,
  async execute(interaction, db) {
    const embed = new EmbedBuilder()
      .setTitle('✨ Server Commands & Info')
      .setDescription('Here are all the available commands and how to use the bot:')
      .setColor(CONFIG.COLORS.PRIMARY)
      .addFields(
        {
          name: '🎫 Ticket Commands',
          value: '`/panel` - Post ticket panel (Staff only)\n`/proof` - Show proof submission guidelines\n`/hrules` - Show helper rules\n`/rrules` - Show runner rules',
          inline: false
        },
        {
          name: '📊 Points Commands',
          value: '`/leaderboard` - View helper leaderboard\n`/points [user]` - Check points for yourself or another user',
          inline: false
        },
        {
          name: '⚙️ Admin Commands',
          value: '`/points_add` - Add points to a user\n`/points_remove` - Remove points from a user\n`/points_set` - Set exact points for a user\n`/points_reset` - Reset all points\n`/points_remove_user` - Remove user from leaderboard',
          inline: false
        }
      )
      .setFooter({ text: 'Need help? Contact staff!' });

    // Add point values
    let pointValues = '';
    CONFIG.CATEGORIES.forEach(cat => {
      const points = CONFIG.POINT_VALUES[cat] || 0;
      pointValues += `**${cat.replace(' Express', '')}:** ${points} pts\n`;
    });

    embed.addFields({ name: '💰 Point Values', value: pointValues, inline: false });

    await interaction.reply({ embeds: [embed] });
  }
});

// ========== ADMIN COMMANDS ==========

// Points Add
const pointsAddCommand = new SlashCommandBuilder()
  .setName('points_add')
  .setDescription('Add points to a user (Admin only)')
  .addUserOption(option =>
    option.setName('user').setDescription('User to add points to').setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('amount').setDescription('Amount of points to add').setRequired(true).setMinValue(1).setMaxValue(100000)
  );

commands.push({
  data: pointsAddCommand,
  async execute(interaction, db) {
    if (!isAdminOrStaff(interaction.member)) {
      return await interaction.reply({
        content: '❌ You don\'t have permission to use this command.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    const newPoints = db.addPoints(user.id, amount);

    const embed = new EmbedBuilder()
      .setTitle('✅ Points Added')
      .setDescription(`Added **${amount.toLocaleString()}** points to ${user}`)
      .setColor(CONFIG.COLORS.SUCCESS)
      .addFields({ name: 'New Total', value: `**${newPoints.toLocaleString()}** points`, inline: false })
      .setFooter({ text: `Modified by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  }
});

// Points Remove
const pointsRemoveCommand = new SlashCommandBuilder()
  .setName('points_remove')
  .setDescription('Remove points from a user (Admin only)')
  .addUserOption(option =>
    option.setName('user').setDescription('User to remove points from').setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('amount').setDescription('Amount of points to remove').setRequired(true).setMinValue(1).setMaxValue(100000)
  );

commands.push({
  data: pointsRemoveCommand,
  async execute(interaction, db) {
    if (!isAdminOrStaff(interaction.member)) {
      return await interaction.reply({
        content: '❌ You don\'t have permission to use this command.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    const currentPoints = db.getPoints(user.id);
    const newPoints = db.removePoints(user.id, amount);
    const actualRemoved = currentPoints - newPoints;

    const embed = new EmbedBuilder()
      .setTitle('✅ Points Removed')
      .setDescription(`Removed **${actualRemoved.toLocaleString()}** points from ${user}`)
      .setColor(CONFIG.COLORS.WARNING)
      .addFields({ name: 'New Total', value: `**${newPoints.toLocaleString()}** points`, inline: false })
      .setFooter({ text: `Modified by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  }
});

// Points Set
const pointsSetCommand = new SlashCommandBuilder()
  .setName('points_set')
  .setDescription('Set user\'s points to exact value (Admin only)')
  .addUserOption(option =>
    option.setName('user').setDescription('User to set points for').setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('amount').setDescription('Exact amount of points').setRequired(true).setMinValue(0).setMaxValue(100000)
  );

commands.push({
  data: pointsSetCommand,
  async execute(interaction, db) {
    if (!isAdminOrStaff(interaction.member)) {
      return await interaction.reply({
        content: '❌ You don\'t have permission to use this command.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    db.setPoints(user.id, amount);

    const embed = new EmbedBuilder()
      .setTitle('✅ Points Set')
      .setDescription(`Set ${user}'s points to **${amount.toLocaleString()}**`)
      .setColor(CONFIG.COLORS.SUCCESS)
      .setFooter({ text: `Modified by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  }
});

// Points Reset
const pointsResetCommand = new SlashCommandBuilder()
  .setName('points_reset')
  .setDescription('Reset all points (Admin only)');

commands.push({
  data: pointsResetCommand,
  async execute(interaction, db) {
    if (!isAdminOrStaff(interaction.member)) {
      return await interaction.reply({
        content: '❌ You don\'t have permission to use this command.',
        ephemeral: true
      });
    }

    db.resetAllPoints();

    const embed = new EmbedBuilder()
      .setTitle('✅ Points Reset Complete')
      .setDescription('All user points have been reset to 0.')
      .setColor(CONFIG.COLORS.SUCCESS)
      .setFooter({ text: `Reset by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  }
});

// Points Remove User
const pointsRemoveUserCommand = new SlashCommandBuilder()
  .setName('points_remove_user')
  .setDescription('Remove a user from the leaderboard (Admin only)')
  .addUserOption(option =>
    option.setName('user').setDescription('User to remove from leaderboard').setRequired(true)
  );

commands.push({
  data: pointsRemoveUserCommand,
  async execute(interaction, db) {
    if (!isAdminOrStaff(interaction.member)) {
      return await interaction.reply({
        content: '❌ You don\'t have permission to use this command.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const deleted = db.deleteUserPoints(user.id);

    const embed = new EmbedBuilder()
      .setTitle(deleted ? '✅ User Removed' : 'ℹ️ User Not Found')
      .setDescription(deleted ? `Removed ${user} from the leaderboard` : `${user} was not in the leaderboard`)
      .setColor(deleted ? CONFIG.COLORS.SUCCESS : CONFIG.COLORS.WARNING)
      .setFooter({ text: `Modified by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  }
});