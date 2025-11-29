// index.js - Main Bot Entry Point

import { Client, GatewayIntentBits, REST, Routes, Collection } from 'discord.js';
import dotenv from 'dotenv';
import BotDatabase from './database.js';
import { commands } from './commands.js';
import {
  handleTicketButtonClick,
  handleBossSelection,
  handleServerSelection,
  handleTicketCreation,
  handleJoinTicket,
  handleCloseTicket,
  handleSubmitProof,
  handleCancelTicket
} from './tickets.js';

dotenv.config();

// Initialize bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize database
const db = new BotDatabase();

// Store commands in collection
client.commands = new Collection();
commands.forEach(cmd => {
  client.commands.set(cmd.data.name, cmd);
});

// Bot ready event
client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`📊 Connected to ${client.guilds.cache.size} guild(s)`);

  // Set bot status
  client.user.setActivity('tickets | /panel', { type: 3 }); // Type 3 = Watching

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    console.log('🔄 Refreshing slash commands...');

    const commandData = commands.map(cmd => cmd.data.toJSON());

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandData }
    );

    console.log(`✅ Successfully registered ${commandData.length} slash commands`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }

  console.log('✅ Bot is ready!');
});

// Interaction handler
client.on('interactionCreate', async (interaction) => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, db);
    }

    // Handle button interactions
    else if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId.startsWith('ticket_open::')) {
        await handleTicketButtonClick(interaction, db);
      } else if (customId === 'ticket_join') {
        await handleJoinTicket(interaction, db);
      } else if (customId === 'ticket_close') {
        await handleCloseTicket(interaction, db);
      } else if (customId === 'ticket_proof') {
        await handleSubmitProof(interaction, db);
      } else if (customId === 'ticket_cancel') {
        await handleCancelTicket(interaction, db);
      }
    }

    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      if (customId.startsWith('boss_select::')) {
        await handleBossSelection(interaction, db);
      } else if (customId.startsWith('server_select::')) {
        await handleServerSelection(interaction, db);
      }
    }

    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      if (customId.startsWith('ticket_create::')) {
        await handleTicketCreation(interaction, db);
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);

    const errorMessage = {
      content: '❌ An error occurred while processing your request.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Error handling
client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Bot shutting down...');
  db.close();
  client.destroy();
  process.exit(0);
});