const { EmbedBuilder, Events } = require('discord.js');
const LogConfig = require('../models/LogConfig'); // adjust path if needed

module.exports = (client) => {
  // Emoji created
  client.on(Events.GuildEmojiCreate, async (emoji) => {
	console.log("[DEBUG] GuildEmojiUpdate fired:", oldEmoji.name, "=>", newEmoji.name);
    const config = await LogConfig.findOne({ guildId: emoji.guild.id });
    if (!config?.logs?.emojiUpdate) return;
    const logChannel = emoji.guild.channels.cache.get(config.logs.emojiUpdate);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0x43b581)
      .setTitle('✨ Emoji Created')
      .setDescription(`A new emoji was created: ${emoji} \`:${emoji.name}:\``)
      .setThumbnail(emoji.url)
      .addFields({ name: 'Emoji ID', value: emoji.id })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Emoji deleted
  client.on(Events.GuildEmojiDelete, async (emoji) => {
    const config = await LogConfig.findOne({ guildId: emoji.guild.id });
    if (!config?.logs?.emojiUpdate) return;
    const logChannel = emoji.guild.channels.cache.get(config.logs.emojiUpdate);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('❌ Emoji Deleted')
      .setDescription(`Emoji deleted: \`:${emoji.name}:\``)
      .addFields({ name: 'Emoji ID', value: emoji.id })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Emoji updated (name or image)
  client.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
    const config = await LogConfig.findOne({ guildId: newEmoji.guild.id });
    if (!config?.logs?.emojiUpdate) return;
    const logChannel = newEmoji.guild.channels.cache.get(config.logs.emojiUpdate);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xffe66d)
      .setTitle('📝 Emoji Updated')
      .setDescription(`Emoji updated: <:${newEmoji.name}:${newEmoji.id}>`)
      .addFields(
        { name: 'Old Name', value: oldEmoji.name, inline: true },
        { name: 'New Name', value: newEmoji.name, inline: true },
        { name: 'Emoji ID', value: newEmoji.id, inline: true }
      )
      .setThumbnail(newEmoji.url)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Sticker created
  client.on(Events.GuildStickerCreate, async (sticker) => {
    const config = await LogConfig.findOne({ guildId: sticker.guild.id });
    if (!config?.logs?.emojiUpdate) return;
    const logChannel = sticker.guild.channels.cache.get(config.logs.emojiUpdate);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0x43b581)
      .setTitle('✨ Sticker Created')
      .setDescription(`A new sticker was created: \`${sticker.name}\``)
      .addFields(
        { name: 'Sticker ID', value: sticker.id, inline: true },
        { name: 'Format', value: sticker.format, inline: true }
      )
      .setImage(sticker.url)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Sticker deleted
  client.on(Events.GuildStickerDelete, async (sticker) => {
    const config = await LogConfig.findOne({ guildId: sticker.guild.id });
    if (!config?.logs?.emojiUpdate) return;
    const logChannel = sticker.guild.channels.cache.get(config.logs.emojiUpdate);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('❌ Sticker Deleted')
      .setDescription(`Sticker deleted: \`${sticker.name}\``)
      .addFields({ name: 'Sticker ID', value: sticker.id })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Sticker updated
  client.on(Events.GuildStickerUpdate, async (oldSticker, newSticker) => {
    const config = await LogConfig.findOne({ guildId: newSticker.guild.id });
    if (!config?.logs?.emojiUpdate) return;
    const logChannel = newSticker.guild.channels.cache.get(config.logs.emojiUpdate);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xffe66d)
      .setTitle('📝 Sticker Updated')
      .setDescription(`Sticker updated: \`${newSticker.name}\``)
      .addFields(
        { name: 'Old Name', value: oldSticker.name, inline: true },
        { name: 'New Name', value: newSticker.name, inline: true },
        { name: 'Sticker ID', value: newSticker.id, inline: true }
      )
      .setImage(newSticker.url)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });
};