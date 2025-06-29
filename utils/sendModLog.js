const { EmbedBuilder } = require("discord.js");
const LogConfig = require("../models/LogConfig"); // adjust path

module.exports = async function sendModLog({
  client,
  guild,
  type,
  targetUser,
  moderator,
  reason,
}) {
  const config = await LogConfig.findOne({ guildId: guild.id });
  if (!config?.logs?.modActions) return;

  const logChannel = guild.channels.cache.get(config.logs.modActions);
  if (!logChannel?.permissionsFor(client.user)?.has("SendMessages")) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🔨 Moderation Action: ${type}`)
    .addFields(
      {
        name: "User",
        value: `${targetUser.tag} (${targetUser.id})`,
        inline: true,
      },
      {
        name: "Moderator",
        value: `${moderator.tag} (${moderator.id})`,
        inline: true,
      },
      { name: "Reason", value: reason || "No reason provided", inline: false }
    )
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  logChannel.send({ embeds: [embed] }).catch(() => {});
};
