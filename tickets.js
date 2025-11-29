// tickets.js - Ticket System with Modal Select Menus

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  AttachmentBuilder
} from 'discord.js';
import { CONFIG } from './config.js';
import {
  isAdminOrStaff,
  generateRoomNumber,
  generateJoinCommands,
  createTicketEmbed,
  generateTranscript,
  createTicketPermissions
} from './utils.js';

// Create ticket panel buttons
export function createTicketPanelButtons() {
  const rows = [];
  let currentRow = new ActionRowBuilder();
  let buttonCount = 0;

  CONFIG.CATEGORIES.forEach((category, index) => {
    const label = category.replace(' Express', '');
    
    const button = new ButtonBuilder()
      .setCustomId(`ticket_open::${category}`)
      .setLabel(label)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(CONFIG.CUSTOM_EMOJI);

    currentRow.addComponents(button);
    buttonCount++;

    // Discord allows max 5 buttons per row
    if (buttonCount === 4 || index === CONFIG.CATEGORIES.length - 1) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
      buttonCount = 0;
    }
  });

  return rows;
}

// Create modal for categories WITH boss selection
export function createBossServerModal(category) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal::${category}`)
    .setTitle(category);

  // Boss selection (using TextInput as workaround - will be converted to select in interaction)
  const bossInput = new TextInputBuilder()
    .setCustomId('bosses')
    .setLabel('Select Bosses (see options below)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Boss selection will appear as dropdown')
    .setRequired(true);

  // Server input
  const serverInput = new TextInputBuilder()
    .setCustomId('server')
    .setLabel('Server (see options below)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Server selection will appear as dropdown')
    .setRequired(true);

  // In-game name
  const nameInput = new TextInputBuilder()
    .setCustomId('in_game_name')
    .setLabel('In-game name?')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter your in-game name')
    .setRequired(true)
    .setMaxLength(100);

  // Concerns
  const concernsInput = new TextInputBuilder()
    .setCustomId('concerns')
    .setLabel('Any concerns?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Optional: Any special requests or concerns')
    .setRequired(false)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(bossInput),
    new ActionRowBuilder().addComponents(serverInput),
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(concernsInput)
  );

  return modal;
}

// Create modal for categories WITHOUT boss selection
export function createServerOnlyModal(category) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_simple::${category}`)
    .setTitle(category);

  // Server input
  const serverInput = new TextInputBuilder()
    .setCustomId('server')
    .setLabel('Server (see options below)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Server selection will appear as dropdown')
    .setRequired(true);

  // In-game name
  const nameInput = new TextInputBuilder()
    .setCustomId('in_game_name')
    .setLabel('In-game name?')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter your in-game name')
    .setRequired(true)
    .setMaxLength(100);

  // Concerns
  const concernsInput = new TextInputBuilder()
    .setCustomId('concerns')
    .setLabel('Any concerns?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Optional: Any special requests or concerns')
    .setRequired(false)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(serverInput),
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(concernsInput)
  );

  return modal;
}

// Create boss selection dropdown
export function createBossSelectMenu(category) {
  let bossList = [];
  
  if (category === 'Daily 4-Man Express') {
    bossList = CONFIG.DAILY_4MAN_BOSSES;
  } else if (category === 'Daily 7-Man Express') {
    bossList = CONFIG.DAILY_7MAN_BOSSES;
  } else if (category === 'Weekly Ultra Express') {
    bossList = CONFIG.WEEKLY_ULTRA_BOSSES;
  }

  const options = bossList.map(boss =>
    new StringSelectMenuOptionBuilder()
      .setLabel(boss)
      .setValue(boss)
      .setEmoji('⚔️')
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`boss_select::${category}`)
    .setPlaceholder(`Select bosses (1-${bossList.length})`)
    .setMinValues(1)
    .setMaxValues(bossList.length)
    .addOptions(options);

  return new ActionRowBuilder().addComponents(selectMenu);
}

// Create server selection dropdown
export function createServerSelectMenu(category, selectedBosses = []) {
  const options = CONFIG.SERVERS.map(server =>
    new StringSelectMenuOptionBuilder()
      .setLabel(server)
      .setValue(server)
      .setEmoji('🌐')
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`server_select::${category}::${JSON.stringify(selectedBosses)}`)
    .setPlaceholder('Select your server')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);

  return new ActionRowBuilder().addComponents(selectMenu);
}

// Create ticket action buttons
export function createTicketActionButtons() {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_join')
        .setLabel('Join Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId('ticket_proof')
        .setLabel('Submit Proof')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📸'),
      new ButtonBuilder()
        .setCustomId('ticket_cancel')
        .setLabel('Cancel Ticket')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌')
    );

  return [row];
}

// Handle ticket button click
export async function handleTicketButtonClick(interaction, db) {
  const category = interaction.customId.split('::')[1];

  // Check if category needs boss selection
  if (['Daily 4-Man Express', 'Daily 7-Man Express', 'Weekly Ultra Express'].includes(category)) {
    // Show boss selection dropdown
    const embed = new EmbedBuilder()
      .setTitle(`🎯 Select Bosses - ${category}`)
      .setDescription('Choose which bosses you need help with:')
      .setColor(CONFIG.COLORS.PRIMARY);

    const row = createBossSelectMenu(category);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  } else {
    // Show server selection dropdown directly
    const embed = new EmbedBuilder()
      .setTitle(`🌍 Select Server - ${category}`)
      .setDescription('Choose which server you\'re playing on:')
      .setColor(CONFIG.COLORS.PRIMARY);

    const row = createServerSelectMenu(category, []);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
}

// Handle boss selection
export async function handleBossSelection(interaction, db) {
  const [, category] = interaction.customId.split('::');
  const selectedBosses = interaction.values;

  // Show server selection
  const embed = new EmbedBuilder()
    .setTitle(`🌍 Select Server - ${category}`)
    .setDescription('Choose which server you\'re playing on:')
    .setColor(CONFIG.COLORS.PRIMARY);

  const row = createServerSelectMenu(category, selectedBosses);

  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}

// Handle server selection
export async function handleServerSelection(interaction, db) {
  const parts = interaction.customId.split('::');
  const category = parts[1];
  const selectedBosses = parts[2] ? JSON.parse(parts[2]) : [];
  const selectedServer = interaction.values[0];

  // Show modal for in-game name and concerns
  const modal = new ModalBuilder()
    .setCustomId(`ticket_create::${category}::${JSON.stringify(selectedBosses)}::${selectedServer}`)
    .setTitle(category);

  const nameInput = new TextInputBuilder()
    .setCustomId('in_game_name')
    .setLabel('In-game name?')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter your in-game name')
    .setRequired(true)
    .setMaxLength(100);

  const concernsInput = new TextInputBuilder()
    .setCustomId('concerns')
    .setLabel('Any concerns?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Optional: Any special requests or concerns')
    .setRequired(false)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(concernsInput)
  );

  await interaction.showModal(modal);
}

// Handle ticket creation from modal
export async function handleTicketCreation(interaction, db) {
  await interaction.deferReply({ ephemeral: true });

  const parts = interaction.customId.split('::');
  const category = parts[1];
  const selectedBosses = parts[2] ? JSON.parse(parts[2]) : [];
  const selectedServer = parts[3];

  const inGameName = interaction.fields.getTextInputValue('in_game_name');
  const concerns = interaction.fields.getTextInputValue('concerns') || 'None';

  const guild = interaction.guild;
  const categoryChannel = guild.channels.cache.get(CONFIG.CHANNELS.TICKETS_CATEGORY);

  if (!categoryChannel) {
    return await interaction.editReply({
      content: '❌ Ticket category not configured!',
      ephemeral: true
    });
  }

  // Generate random room number
  const randomNumber = generateRoomNumber();

  // Get channel prefix
  const prefix = CONFIG.CATEGORY_METADATA[category]?.prefix || 'ticket';
  const username = interaction.user.username.toLowerCase().replace(/\s/g, '').substring(0, 20);
  const channelName = `${prefix}-${username}`;

  // Create ticket channel
  const permissions = createTicketPermissions(guild, interaction.user.id);

  try {
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryChannel.id,
      permissionOverwrites: permissions
    });

    // Create ticket data
    const ticketData = {
      channel_id: ticketChannel.id,
      category: category,
      requestor_id: interaction.user.id,
      helpers: [],
      points: CONFIG.POINT_VALUES[category] || 0,
      random_number: randomNumber,
      proof_submitted: false,
      in_game_name: inGameName,
      concerns: concerns,
      selected_bosses: selectedBosses,
      selected_server: selectedServer,
      is_closed: false
    };

    // Create embed
    const embed = new EmbedBuilder(createTicketEmbed(ticketData));

    // Send ticket message
    const helperRole = CONFIG.ROLES.HELPER;
    const pingContent = `${interaction.user} ${helperRole ? `<@&${helperRole}>` : ''} ticket created!`;

    const ticketMessage = await ticketChannel.send({
      content: pingContent,
      embeds: [embed],
      components: createTicketActionButtons()
    });

    // Save to database
    ticketData.embed_message_id = ticketMessage.id;
    db.saveTicket(ticketData);

    // Generate join commands
    const joinCommands = generateJoinCommands(category, selectedBosses, randomNumber);

    // Send confirmation to user
    const confirmMessage = `✅ Ticket created: ${ticketChannel}\n\n**🎮 Your Room Number: \`${randomNumber}\`**`;
    
    await interaction.editReply({
      content: joinCommands ? `${confirmMessage}\n\n**Join Commands:**\n${joinCommands}` : confirmMessage,
      ephemeral: true
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.editReply({
      content: `❌ Failed to create ticket: ${error.message}`,
      ephemeral: true
    });
  }
}

// Handle join ticket button
export async function handleJoinTicket(interaction, db) {
  const ticket = db.getTicket(interaction.channel.id);

  if (!ticket) {
    return await interaction.reply({
      content: '❌ No active ticket found.',
      ephemeral: true
    });
  }

  if (ticket.is_closed) {
    return await interaction.reply({
      content: '❌ This ticket is already closed.',
      ephemeral: true
    });
  }

  // Check if user is requestor
  if (interaction.user.id === ticket.requestor_id) {
    return await interaction.reply({
      content: '❌ You cannot join your own ticket.',
      ephemeral: true
    });
  }

  // Check if already a helper
  if (ticket.helpers.includes(interaction.user.id)) {
    return await interaction.reply({
      content: '❌ You are already a helper in this ticket.',
      ephemeral: true
    });
  }

  // Check helper slots
  const maxSlots = CONFIG.HELPER_SLOTS[ticket.category] || 3;
  if (ticket.helpers.length >= maxSlots) {
    return await interaction.reply({
      content: `❌ This ticket is full (${maxSlots}/${maxSlots} helpers).`,
      ephemeral: true
    });
  }

  // Check if helper is in another ticket
  const allTickets = db.getAllActiveTickets();
  for (const otherTicket of allTickets) {
    if (otherTicket.channel_id !== interaction.channel.id) {
      if (otherTicket.helpers.includes(interaction.user.id)) {
        const otherChannel = interaction.guild.channels.cache.get(otherTicket.channel_id);
        return await interaction.reply({
          content: `❌ You are already helping in another ticket: ${otherChannel || 'Unknown Channel'}\nYou can only help in ONE ticket at a time.`,
          ephemeral: true
        });
      }
    }
  }

  // Add helper
  ticket.helpers.push(interaction.user.id);
  db.saveTicket(ticket);

  // Update channel permissions
  await interaction.channel.permissionOverwrites.create(interaction.user, {
    ViewChannel: true,
    SendMessages: true
  });

  // Update ticket embed
  const updatedEmbed = new EmbedBuilder(createTicketEmbed(ticket));

  try {
    const message = await interaction.channel.messages.fetch(ticket.embed_message_id);
    await message.edit({ embeds: [updatedEmbed] });
  } catch (error) {
    console.error('Error updating ticket embed:', error);
  }

  // Send join commands
  const joinCommands = generateJoinCommands(ticket.category, ticket.selected_bosses, ticket.random_number);

  await interaction.reply({
    content: `✅ ${interaction.user} joined the ticket!\n\n**🎮 Room Number: \`${ticket.random_number}\`**\n\n**Join Commands:**\n${joinCommands || 'No commands available'}`,
    ephemeral: false
  });
}

// Handle close ticket button
export async function handleCloseTicket(interaction, db) {
  const ticket = db.getTicket(interaction.channel.id);

  if (!ticket) {
    return await interaction.reply({
      content: '❌ No active ticket found.',
      ephemeral: true
    });
  }

  if (ticket.is_closed) {
    return await interaction.reply({
      content: '❌ This ticket is already closed.',
      ephemeral: true
    });
  }

  // Check permissions (staff/admin or requestor)
  const isStaff = isAdminOrStaff(interaction.member);
  const isRequestor = interaction.user.id === ticket.requestor_id;

  if (!isStaff && !isRequestor) {
    return await interaction.reply({
      content: '❌ Only staff or the ticket creator can close tickets.',
      ephemeral: true
    });
  }

  // Check if proof was submitted
  if (!ticket.proof_submitted) {
    return await interaction.reply({
      content: '❌ Please submit proof before closing the ticket.\nUpload a screenshot showing completed quests and helper names, then click **Submit Proof**.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  // Award points to helpers
  const pointsPerHelper = ticket.points;
  let totalAwarded = 0;

  for (const helperId of ticket.helpers) {
    db.addPoints(helperId, pointsPerHelper);
    totalAwarded += pointsPerHelper;
  }

  // Mark ticket as closed
  ticket.is_closed = true;
  db.saveTicket(ticket);

  // Save to history
  db.saveTicketHistory({
    channel_id: ticket.channel_id,
    category: ticket.category,
    requestor_id: ticket.requestor_id,
    helpers: JSON.stringify(ticket.helpers),
    points_per_helper: pointsPerHelper,
    total_points_awarded: totalAwarded,
    closed_by: interaction.user.id
  });

  // Generate transcript
  const transcript = await generateTranscript(interaction.channel);

  // Send transcript to transcript channel
  const transcriptChannelId = CONFIG.CHANNELS.TRANSCRIPT;
  if (transcriptChannelId) {
    const transcriptChannel = interaction.guild.channels.cache.get(transcriptChannelId);
    if (transcriptChannel) {
      const summaryEmbed = new EmbedBuilder()
        .setTitle(`📋 Ticket Closed - ${ticket.category}`)
        .setColor(CONFIG.COLORS.SUCCESS)
        .setTimestamp()
        .addFields(
          { name: 'Requestor', value: `<@${ticket.requestor_id}>`, inline: true },
          { name: 'Helpers', value: `${ticket.helpers.length}`, inline: true },
          { name: 'Points Awarded', value: `${totalAwarded.toLocaleString()}`, inline: true },
          {
            name: 'Helper List',
            value: ticket.helpers.length > 0 ? ticket.helpers.map(id => `<@${id}>`).join('\n') : 'None',
            inline: false
          }
        )
        .setFooter({ text: `Closed by ${interaction.user.tag}` });

      const attachment = new AttachmentBuilder(
        Buffer.from(transcript, 'utf-8'),
        { name: `ticket-${ticket.channel_id}.txt` }
      );

      await transcriptChannel.send({
        embeds: [summaryEmbed],
        files: [attachment]
      });
    }
  }

  // Send close message
  const closeEmbed = new EmbedBuilder()
    .setTitle('✅ Ticket Closed')
    .setDescription(
      `**Points Awarded:** ${totalAwarded.toLocaleString()} total (${pointsPerHelper.toLocaleString()} per helper)\n` +
      `**Helpers:** ${ticket.helpers.length}\n\n` +
      'This channel will be deleted in 10 seconds...'
    )
    .setColor(CONFIG.COLORS.SUCCESS)
    .setFooter({ text: `Closed by ${interaction.user.tag}` });

  await interaction.editReply({ embeds: [closeEmbed] });

  // Delete channel after 10 seconds
  setTimeout(async () => {
    try {
      await interaction.channel.delete(`Ticket closed by ${interaction.user.tag}`);
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  }, 10000);
}

// Handle submit proof button
export async function handleSubmitProof(interaction, db) {
  const ticket = db.getTicket(interaction.channel.id);

  if (!ticket) {
    return await interaction.reply({
      content: '❌ No active ticket found.',
      ephemeral: true
    });
  }

  if (ticket.is_closed) {
    return await interaction.reply({
      content: '❌ This ticket is already closed.',
      ephemeral: true
    });
  }

  // Only requestor can submit proof
  if (interaction.user.id !== ticket.requestor_id) {
    return await interaction.reply({
      content: '❌ Only the ticket creator can submit proof.',
      ephemeral: true
    });
  }

  // Mark proof as submitted
  ticket.proof_submitted = true;
  db.saveTicket(ticket);

  await interaction.reply({
    content: '✅ Proof submitted! You can now close the ticket.',
    ephemeral: false
  });
}

// Handle cancel ticket button
export async function handleCancelTicket(interaction, db) {
  const ticket = db.getTicket(interaction.channel.id);

  if (!ticket) {
    return await interaction.reply({
      content: '❌ No active ticket found.',
      ephemeral: true
    });
  }

  // Check permissions (staff/admin or requestor)
  const isStaff = isAdminOrStaff(interaction.member);
  const isRequestor = interaction.user.id === ticket.requestor_id;

  if (!isStaff && !isRequestor) {
    return await interaction.reply({
      content: '❌ Only staff or the ticket creator can cancel tickets.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  // Mark as closed without points
  ticket.is_closed = true;
  db.saveTicket(ticket);

  const cancelEmbed = new EmbedBuilder()
    .setTitle('❌ Ticket Cancelled')
    .setDescription('This ticket was cancelled. No points were awarded.\n\nThis channel will be deleted in 5 seconds...')
    .setColor(CONFIG.COLORS.WARNING)
    .setFooter({ text: `Cancelled by ${interaction.user.tag}` });

  await interaction.editReply({ embeds: [cancelEmbed] });

  // Delete channel after 5 seconds
  setTimeout(async () => {
    try {
      await interaction.channel.delete(`Ticket cancelled by ${interaction.user.tag}`);
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  }, 5000);
}