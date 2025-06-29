// utils/sendWelcomeLeave.js
const WelcomeConfig = require("../models/WelcomeConfig");
const Embed = require("../models/Embed");
const { EmbedBuilder } = require("discord.js");

function buildEmbedFromDoc(embedDoc, member, guild) {
  const replacements = {
    "{user}": `<@${member.id}>`,
    "{username}": member.user.username,
    "{userTag}": member.user.tag,
    "{userId}": member.id,
    "{userAvatar}": member.user.displayAvatarURL({ dynamic: true }),
    "{server}": guild.name,
  };
  const replace = (text) => {
    if (!text) return undefined;
    return Object.entries(replacements).reduce(
      (acc, [key, value]) => acc.replaceAll(key, value),
      text
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

async function sendWelcomeOrLeave(member, type) {
  // type: 'welcome' or 'leave'
  const config = await WelcomeConfig.findOne({ guildId: member.guild.id });
  if (!config) return;

  const channelId = config[`${type}Channel`];
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  // For embed type: send embed, and optionally text
  if (config[`${type}Type`] === "embed" && config[`${type}EmbedName`]) {
    const embedDoc = await Embed.findOne({
      guildId: member.guild.id,
      name: config[`${type}EmbedName`],
    });
    if (!embedDoc) return;

    const embed = buildEmbedFromDoc(embedDoc, member, member.guild);

    // Send both text and embed (together, like Mimu)
    if (config[`${type}Text`]) {
      const message = config[`${type}Text`]
        .replaceAll("{user}", `<@${member.id}>`)
        .replaceAll("{username}", member.user.username)
        .replaceAll("{server}", member.guild.name);

      // Send both in ONE message (for classic Mimu look)
      await channel.send({ content: message, embeds: [embed] });

      // --- OR ---
      // Send as two messages (uncomment if you want this style):
      // await channel.send({ content: message });
      // await channel.send({ embeds: [embed] });
    } else {
      await channel.send({ embeds: [embed] });
    }
  }
  // For text type: just send the text
  else if (config[`${type}Type`] === "text" && config[`${type}Text`]) {
    const message = config[`${type}Text`]
      .replaceAll("{user}", `<@${member.id}>`)
      .replaceAll("{username}", member.user.username)
      .replaceAll("{server}", member.guild.name);
    await channel.send({ content: message });
  }
}

module.exports = sendWelcomeOrLeave;
