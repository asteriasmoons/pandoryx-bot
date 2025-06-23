// utils/sendWelcomeLeave.js
const WelcomeConfig = require('../models/WelcomeConfig');
const Embed = require('../models/Embed');
const { EmbedBuilder } = require('discord.js');

// Helper to build EmbedBuilder from embedDoc
function buildEmbedFromDoc(embedDoc, member, guild) {
  const replacements = {
    '{user}': `<@${member.id}>`,
    '{username}': member.user.username,
    '{userTag}': member.user.tag,
    '{userId}': member.id,
    '{userAvatar}': member.user.displayAvatarURL({ dynamic: true }),
    '{server}': guild.name,
  };
  const replace = (text) => {
    if (!text) return undefined;
    return Object.entries(replacements).reduce(
      (acc, [key, value]) => acc.replaceAll(key, value), text
    );
  };

  const embed = new EmbedBuilder();
  if (embedDoc.title) embed.setTitle(replace(embedDoc.title));
  if (embedDoc.description) embed.setDescription(replace(embedDoc.description));
  if (embedDoc.color) embed.setColor(embedDoc.color);
  if (embedDoc.author && (embedDoc.author.name || embedDoc.author.icon_url)) {
    embed.setAuthor({
      name: replace(embedDoc.author.name),
      iconURL: replace(embedDoc.author.icon_url),
    });
  }
  if (embedDoc.footer && (embedDoc.footer.text || embedDoc.footer.icon_url)) {
    embed.setFooter({
      text: replace(embedDoc.footer.text),
      iconURL: replace(embedDoc.footer.icon_url),
    });
  }
  if (embedDoc.footer && embedDoc.footer.timestamp) embed.setTimestamp();
  if (embedDoc.thumbnail) embed.setThumbnail(replace(embedDoc.thumbnail));
  if (embedDoc.image) embed.setImage(replace(embedDoc.image));
  return embed;
}

// Call this from your event listeners!
async function sendWelcomeOrLeave(member, type) {
  // type: 'welcome' or 'leave'
  const config = await WelcomeConfig.findOne({ guildId: member.guild.id });
  if (!config) return;

  const channelId = config[`${type}Channel`];
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  // Use embedName, NOT embedId!
  if (config[`${type}Type`] === 'embed' && config[`${type}EmbedName`]) {
    const embedDoc = await Embed.findOne({ guildId: member.guild.id, name: config[`${type}EmbedName`] });
    if (!embedDoc) return;
    const embed = buildEmbedFromDoc(embedDoc, member, member.guild);
    channel.send({ embeds: [embed] });
  } else if (config[`${type}Type`] === 'text' && config[`${type}Text`]) {
    // Replace placeholders
    const message = config[`${type}Text`]
      .replaceAll('{user}', `<@${member.id}>`)
      .replaceAll('{username}', member.user.username)
      .replaceAll('{server}', member.guild.name);
    channel.send({ content: message });
  }
}

module.exports = sendWelcomeOrLeave;