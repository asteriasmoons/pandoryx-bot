// utils/buildEmbedFromDoc.js
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

module.exports = buildEmbedFromDoc;
