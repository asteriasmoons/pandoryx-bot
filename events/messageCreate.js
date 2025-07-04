// events/messageCreate.js
const StickyEmbed = require("../models/StickyEmbed");
const AfkStatus = require("../models/AfkStatus");
const AfkConfig = require("../models/AfkConfig");
const AutoDeleteChannel = require("../models/AutoDeleteChannel");
const BumpReminder = require("../models/BumpReminder");
const { EmbedBuilder } = require("discord.js");
const { handleLeveling } = require("../utils/leveling");

const DISBOARD_ID = "302050872383242240"; // Disboard bot user ID

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    // Ignore ALL bot messages except for Disboard bump tracking
    if (message.author.bot) {
      // ------ BUMP REMINDER LOGIC ------
      // Only listen for Disboard "Bump done" embeds in the configured channel
      if (message.author.id === DISBOARD_ID) {
        // Fetch bump config for this guild
        const guildId = message.guild.id;
        const bumpConfig = await BumpReminder.findOne({ guildId });

        // Proceed ONLY if:
        // 1. There's a bump config with a set channel
        // 2. This message is in that channel
        if (
          bumpConfig &&
          bumpConfig.channelId === message.channel.id &&
          message.embeds.length &&
          message.embeds[0].description?.includes("Bump done")
        ) {
          // Update the last bump timestamp (and keep the configured channelId)
          await BumpReminder.findOneAndUpdate(
            { guildId },
            { lastBump: new Date() }
          );

          // === CONFIRMATION OF BUMP EMBED ===
          const confirmationEmbed = new EmbedBuilder()
            .setTitle("✅ Bump Tracked!")
            .setDescription("I've tracked this bump and will remind you in 2 hours.")
            .setColor(0x57f287)
            .setTimestamp();

          try {
            await message.channel.send({ embeds: [confirmationEmbed] });
          } catch (e) {
            // fail silently if it can't send
          }

          // Optional: Log to console for debugging
          console.log(
            `[BUMP] Disboard bump detected in ${guildId} at ${new Date().toISOString()}`
          );
        }
      }
      // Ignore all other bots
      return;
    }

    // ------ AUTODELETE LOGIC STARTS HERE ------
    // If this channel is configured for autodelete, schedule message deletion
    if (message.guildId) {
      const autodeleteConfig = await AutoDeleteChannel.findOne({
        guildId: message.guildId,
        channelId: message.channel.id,
      });

      if (autodeleteConfig) {
        setTimeout(async () => {
          try {
            if (!message.deleted) {
              await message.delete();
            }
          } catch (err) {
            // Silently fail if cannot delete (already gone or missing perms)
          }
        }, (autodeleteConfig.delaySeconds ?? 10) * 1000);
      }
    }
    // ------ AUTODELETE LOGIC ENDS HERE ------

    // --- LEVELING GOES HERE! ---
    handleLeveling(message);

    // ------ AFK LOGIC STARTS HERE ------
    // 1. Check if the author was AFK and clear AFK status if needed
    if (message.guildId) {
      const afkConfig = await AfkConfig.findOne({ guildId: message.guildId });
      const noMessageReset = afkConfig?.noMessageReset || false;

      const afkStatus = await AfkStatus.findOne({
        userId: message.author.id,
        guildId: message.guildId,
      });

      if (afkStatus && !noMessageReset) {
        // Clear AFK status for this user
        await AfkStatus.deleteOne({
          userId: message.author.id,
          guildId: message.guildId,
        });

        // Optional: Inform user their AFK is cleared (can remove this if you want)
        const clearedEmbed = new EmbedBuilder()
          .setDescription("Your AFK status has been removed.")
          .setColor("#5865F2");
        try {
          await message.reply({ embeds: [clearedEmbed] });
        } catch (e) {
          // fail silently
        }
      }
    }

    // 2. Check if message mentions or replies to AFK users, and send AFK embed(s)
    if (message.guildId) {
      // Collect all user IDs we should check for AFK (mentions + replied user)
      const afkUserIds = new Set();

      // Mentions
      if (message.mentions.users.size > 0) {
        message.mentions.users.forEach((user) => afkUserIds.add(user.id));
      }

      // Reply
      if (message.reference && message.reference.messageId) {
        try {
          const repliedMsg = await message.channel.messages.fetch(
            message.reference.messageId
          );
          if (
            repliedMsg &&
            repliedMsg.author &&
            !afkUserIds.has(repliedMsg.author.id)
          ) {
            afkUserIds.add(repliedMsg.author.id);
          }
        } catch (e) {
          // couldn't fetch replied message
        }
      }

      // For each AFK user mentioned or replied to, check and notify
      for (const userId of afkUserIds) {
        // if (userId === message.author.id) continue; // Don't notify for yourself

        const afkStatus = await AfkStatus.findOne({
          userId,
          guildId: message.guildId,
        });
        if (afkStatus) {
          // Show the AFK message in a neat embed
          const member = await message.guild.members
            .fetch(userId)
            .catch(() => null);

          const afkEmbed = new EmbedBuilder()
            .setTitle("AFK Notice")
            .setDescription(
              `${member ? `<@${userId}>` : "This user"} is currently AFK.\n\n` +
                `**Message:**\n${afkStatus.message}\n` +
                `**Since:** <t:${Math.floor(
                  new Date(afkStatus.since).getTime() / 1000
                )}:R>`
            )
            .setColor("#5865F2");

          try {
            await message.reply({ embeds: [afkEmbed] });
          } catch (e) {
            // fail silently if cannot send reply
          }
        }
      }
    }
    // ------ AFK LOGIC ENDS HERE ------

    // ------ STICKY LOGIC ------
    // Find all stickies in this channel for this guild
    const stickies = await StickyEmbed.find({
      guildId: message.guildId,
      "stickies.channelId": message.channel.id,
    });
    if (!stickies.length) return;

    for (const sticky of stickies) {
      // Find the sticky record for this channel
      const stickyInfo = sticky.stickies.find(
        (s) => s.channelId === message.channel.id
      );
      if (stickyInfo && stickyInfo.messageId) {
        try {
          const oldMsg = await message.channel.messages.fetch(
            stickyInfo.messageId
          );
          if (oldMsg) await oldMsg.delete();
        } catch (e) {
          // Ignore if already deleted
        }
      }

      // Re-send the sticky embed
      const embed = new EmbedBuilder()
        .setTitle(sticky.embed.title)
        .setDescription(sticky.embed.description)
        .setColor(sticky.embed.color || "#5865F2");
      const sentMsg = await message.channel.send({ embeds: [embed] });

      // Update sticky messageId in DB for this channel
      sticky.stickies = sticky.stickies.map((s) =>
        s.channelId === message.channel.id
          ? { channelId: s.channelId, messageId: sentMsg.id }
          : s
      );
      await sticky.save();
    }
  });
};