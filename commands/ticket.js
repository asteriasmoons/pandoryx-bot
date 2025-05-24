// ticket.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

// Robust emoji parser for both Unicode and custom emojis
function parseEmoji(emoji) {
  if (!emoji) return undefined;
  // Custom emoji: <a:name:id> or <:name:id>
  const match = emoji.match(/^<(a)?:([a-zA-Z0-9_]+):(\d+)>$/);
  if (match) {
    return { id: match[3], name: match[2], animated: !!match[1] };
  }
  // Just an emoji ID (not recommended, but handle it)
  if (/^\d+$/.test(emoji)) {
    return { id: emoji };
  }
  // Otherwise, treat as Unicode
  return emoji;
}

const TicketPanel = require('../models/TicketPanel');
const TicketInstance = require('../models/TicketInstance');
const GuildSetting = require('../models/GuildSetting');

// 1. Slash Command Data (for registration)
const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Ticket system commands')
  .addSubcommandGroup(group =>
    group
      .setName('panel')
      .setDescription('Ticket panel management')
      .addSubcommand(sub =>
        sub
          .setName('create')
          .setDescription('Create a ticket panel config')
          .addStringOption(opt =>
            opt.setName('name').setDescription('Panel name').setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName('title').setDescription('Embed title').setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName('description').setDescription('Embed description').setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName('color').setDescription('Embed color (hex, e.g. #5865F2)').setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName('emoji').setDescription('Emoji for the button (unicode or emoji ID)').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('send')
          .setDescription('Send a ticket panel')
          .addStringOption(opt =>
            opt.setName('name').setDescription('Panel name').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('edit')
          .setDescription('Edit a ticket panel config')
          .addStringOption(opt =>
            opt.setName('name').setDescription('Panel name').setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName('title').setDescription('Embed title').setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName('description').setDescription('Embed description').setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName('color').setDescription('Embed color (hex, e.g. #8102ff)').setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName('emoji').setDescription('Emoji for the button (unicode or emoji ID)').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('delete')
          .setDescription('Delete a ticket panel')
          .addStringOption(opt =>
            opt.setName('name').setDescription('Panel name').setRequired(true)
          )
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName('config')
      .setDescription('Ticket system configuration')
      .addSubcommand(sub =>
        sub
          .setName('transcript')
          .setDescription('Set the transcript log channel')
          .addChannelOption(opt =>
            opt.setName('channel')
              .setDescription('Channel to send ticket transcripts to')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('staffrole')
          .setDescription('Set the staff role that can see all tickets')
          .addRoleOption(opt =>
            opt.setName('role')
              .setDescription('The staff role')
              .setRequired(true)
          )
      )
  );

// 2. Command Handler
async function execute(interaction) {
  // Get subcommand group and subcommand
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();

  if (group === 'config' && sub === 'staffrole') {
    if (
      !(
        interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      )
    ) {
      return interaction.reply({
        content: "You don't have permission to configure the ticket system. (Requires Manage Server or Administrator)",
        ephemeral: true
      });
    }

    const role = interaction.options.getRole('role');
    await GuildSetting.findOneAndUpdate(
      { guildId: interaction.guild.id },
      { staffRoleId: role.id },
      { upsert: true }
    );
    return interaction.reply({
      content: `Staff role set to ${role}. This role will be able to view all tickets.`,
      ephemeral: true
    });
  }

  // /ticket config transcript
  if (group === 'config' && sub === 'transcript') {
    if (
      !(
        interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      )
    ) {
      return interaction.reply({
        content: "You don't have permission to configure the ticket system. (Requires Manage Server or Administrator)",
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel('channel');
    await GuildSetting.findOneAndUpdate(
      { guildId: interaction.guild.id },
      { transcriptChannelId: channel.id },
      { upsert: true }
    );
    return interaction.reply({
      content: `Transcript channel set to ${channel}.`,
      ephemeral: true
    });
  }

  // Permission check for panel management (create, edit, delete)
  if (
    group === 'panel' &&
    ['create', 'edit', 'delete'].includes(sub) &&
    !(
      interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    )
  ) {
    return interaction.reply({
      content: "You don't have permission to use this command. (Requires Manage Channels or Administrator)",
      ephemeral: true
    });
  }

  // /ticket panel create
  if (group === 'panel' && sub === 'create') {
    const name = interaction.options.getString('name');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color');
    const emoji = interaction.options.getString('emoji');

    if (await TicketPanel.findOne({ name })) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Already Exists')
            .setDescription(`A panel with the name \`${name}\` already exists.`)
            .setColor(0x8102ff)
        ],
        ephemeral: true
      });
    }

    await TicketPanel.create({
      name,
      embed: { title, description, color },
      emoji,
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Panel Created')
          .setDescription(`Panel \`${name}\` created and ready to send!`)
          .setColor(0x8102ff)
      ],
      ephemeral: true
    });
  }

  // /ticket panel send
  if (group === 'panel' && sub === 'send') {
    const name = interaction.options.getString('name');
    const panel = await TicketPanel.findOne({ name });
    if (!panel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Not Found')
            .setDescription(`No panel found with the name \`${name}\`.`)
            .setColor(0x8102ff)
        ],
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(panel.embed.title)
      .setDescription(panel.embed.description)
      .setColor(panel.embed.color);

    const button = new ButtonBuilder()
      .setCustomId(`open_ticket_modal:${name}`)
      .setLabel('Open Ticket')
      .setStyle(ButtonStyle.Secondary);

    if (panel.emoji) {
  console.log('panel.emoji:', panel.emoji, 'parsed:', parseEmoji(panel.emoji));
  button.setEmoji(parseEmoji(panel.emoji));
}

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Panel Sent')
          .setDescription(`Ticket panel \`${name}\` has been sent successfully!`)
          .setColor(0x8102ff)
      ]
      // intentionally not ephemeral so staff can see confirmation in the channel
    });
  }

  // /ticket panel edit
  if (group === 'panel' && sub === 'edit') {
    const name = interaction.options.getString('name');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color');
    const emoji = interaction.options.getString('emoji');

    const panel = await TicketPanel.findOne({ name });
    if (!panel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Not Found')
            .setDescription(`No panel found with the name \`${name}\`.`)
            .setColor(0x8102ff)
        ],
        ephemeral: true
      });
    }

    // Update the panel fields
    panel.embed = { title, description, color };
    // Only overwrite the emoji if a new one is provided, otherwise keep the current one
    if (emoji !== null && emoji !== undefined && emoji !== "") {
      panel.emoji = emoji;
    }
    await panel.save();

    // Update the Discord message if it exists
    if (panel.channelId && panel.messageId) {
      try {
        const channel = await interaction.guild.channels.fetch(panel.channelId);
        const msg = await channel.messages.fetch(panel.messageId);

        // Rebuild the embed and button (with emoji)
        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color);

        const button = new ButtonBuilder()
          .setCustomId(`open_ticket_modal:${name}`)
          .setLabel('Open Ticket')
          .setStyle(ButtonStyle.Secondary);

        if (panel.emoji) {
  console.log('panel.emoji:', panel.emoji, 'parsed:', parseEmoji(panel.emoji));
  button.setEmoji(parseEmoji(panel.emoji));
}


        const row = new ActionRowBuilder().addComponents(button);

        await msg.edit({ embeds: [embed], components: [row] });
      } catch {
        // If message or channel is gone, ignore for now
      }
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Panel Updated')
          .setDescription(`Panel \`${name}\` has been updated.`)
          .setColor(0x8102ff)
      ],
      ephemeral: true
    });
  }

  // /ticket panel delete
  if (group === 'panel' && sub === 'delete') {
    const name = interaction.options.getString('name');
    const panel = await TicketPanel.findOne({ name });
    if (!panel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Not Found')
            .setDescription(`No panel found with the name \`${name}\`.`)
            .setColor(0x8102ff)
        ],
        ephemeral: true
      });
    }

    // Delete the message if it exists
    if (panel.channelId && panel.messageId) {
      try {
        const channel = await interaction.guild.channels.fetch(panel.channelId);
        const msg = await channel.messages.fetch(panel.messageId);
        await msg.delete();
      } catch {
        // If message or channel is gone, ignore for now
      }
    }

    await panel.deleteOne();

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Panel Deleted')
          .setDescription(`Panel \`${name}\` has been deleted.`)
          .setColor(0x8102ff)
      ],
      ephemeral: true
    });
  }
}

// 3. Component & Modal Handlers
async function handleComponent(interaction) {
  // Button: open ticket modal
  if (interaction.isButton() && interaction.customId.startsWith('open_ticket_modal:')) {
    const panelName = interaction.customId.split(':')[1];
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_submit:${panelName}`)
      .setTitle('Open a Ticket')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('issue')
            .setLabel('What do you need help with?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );
    return interaction.showModal(modal);
  }

  // Modal: create ticket channel
  if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_submit:')) {
    const panelName = interaction.customId.split(':')[1];
    const issue = interaction.fields.getTextInputValue('issue');

    // Create ticket channel
    // Fetch staff role from DB (if set)
    const guildSettings = await GuildSetting.findOne({ guildId: interaction.guild.id });
    const staffRoleId = guildSettings?.staffRoleId;

    const permissionOverwrites = [
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
    ];

    if (staffRoleId) {
      permissionOverwrites.push({
        id: staffRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });
    }

    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      permissionOverwrites,
    });

    await TicketInstance.create({
      ticketId: ticketChannel.id,
      userId: interaction.user.id,
      panelName,
      channelId: ticketChannel.id,
      status: 'open',
      content: { issue }
    });

    await ticketChannel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [
        new EmbedBuilder()
          .setTitle('Ticket Opened')
          .setDescription(`**Issue:**\n${issue}`)
          .setColor(0x8102ff)
      ]
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Ticket Created')
          .setDescription(`Your ticket has been created: <#${ticketChannel.id}>`)
          .setColor(0x8102ff)
      ],
      ephemeral: true
    });
  }
}

// 4. Export for use in your main bot file
module.exports = {
  data,
  execute,
  handleComponent,
};