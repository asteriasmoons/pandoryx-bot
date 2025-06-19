const { EmbedBuilder, Events } = require('discord.js');
const LogConfig = require('../models/LogConfig'); // adjust path

module.exports = (client) => {
  // Member joins
  client.on(Events.GuildMemberAdd, async (member) => {
    const config = await LogConfig.findOne({ guildId: member.guild.id });
    if (!config?.logs?.memberJoin) return;

    const logChannel = member.guild.channels.cache.get(config.logs.memberJoin);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('📥 Member Joined')
      .setDescription(`${member} (${member.user.tag}) joined the server.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Member leaves
  client.on(Events.GuildMemberRemove, async (member) => {
    const config = await LogConfig.findOne({ guildId: member.guild.id });
    if (!config?.logs?.memberLeave) return;

    const logChannel = member.guild.channels.cache.get(config.logs.memberLeave);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('📤 Member Left')
      .setDescription(`${member.user.tag} (${member.id}) left the server.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Role or nickname updated
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const config = await LogConfig.findOne({ guildId: newMember.guild.id });
    if (!config?.logs?.roleUpdate && !config?.logs?.nicknameChange) return;

    const logChannel = newMember.guild.channels.cache.get(config.logs.roleUpdate || config.logs.nicknameChange);
    if (!logChannel) return;

    const embed = new EmbedBuilder().setTimestamp().setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }));

    // Nickname changed
    if (oldMember.nickname !== newMember.nickname && config.logs.nicknameChange) {
      embed
        .setColor(0xfee75c)
        .setTitle('✏️ Nickname Changed')
        .addFields(
          { name: 'User', value: `${newMember.user.tag} (${newMember.id})` },
          { name: 'Before', value: oldMember.nickname || 'None', inline: true },
          { name: 'After', value: newMember.nickname || 'None', inline: true }
        );

      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // Roles changed
    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());

    const addedRoles = [...newRoles].filter(id => !oldRoles.has(id));
    const removedRoles = [...oldRoles].filter(id => !newRoles.has(id));

    if ((addedRoles.length > 0 || removedRoles.length > 0) && config.logs.roleUpdate) {
      embed
        .setColor(0x5865f2)
        .setTitle('🎭 Roles Updated')
        .setDescription(`${newMember.user.tag} (${newMember.id}) had their roles changed.`)
        .addFields(
          addedRoles.length > 0
            ? { name: 'Added', value: addedRoles.map(id => `<@&${id}>`).join(', '), inline: true }
            : {},
          removedRoles.length > 0
            ? { name: 'Removed', value: removedRoles.map(id => `<@&${id}>`).join(', '), inline: true }
            : {}
        );

      logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  // Username or avatar changed
  client.on(Events.UserUpdate, async (oldUser, newUser) => {
    // You’ll need to check which guilds the user is in and log per-guild
    client.guilds.cache.forEach(async (guild) => {
      const member = await guild.members.fetch(newUser.id).catch(() => null);
      if (!member) return;

      const config = await LogConfig.findOne({ guildId: guild.id });
      if (!config?.logs?.usernameChange && !config?.logs?.avatarChange) return;

      const logChannel = guild.channels.cache.get(config.logs.usernameChange || config.logs.avatarChange);
      if (!logChannel) return;

      const embed = new EmbedBuilder().setTimestamp();

      if (oldUser.username !== newUser.username && config.logs.usernameChange) {
        embed
          .setColor(0xfee75c)
          .setTitle('🪪 Username Changed')
          .setDescription(`**Before:** ${oldUser.username}\n**After:** ${newUser.username}`)
          .setThumbnail(newUser.displayAvatarURL({ dynamic: true }));

        logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      if (oldUser.displayAvatarURL() !== newUser.displayAvatarURL() && config.logs.avatarChange) {
        embed
          .setColor(0x3498db)
          .setTitle('🖼️ Avatar Changed')
          .setDescription(`${newUser.tag} updated their avatar.`)
          .setImage(newUser.displayAvatarURL({ dynamic: true }));

        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    });
  });
};