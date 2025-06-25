// utils/checkPermission.js
const CommandPermissions = require('../models/CommandPermissions');

async function hasCommandPermission(interaction, commandName) {
  // ✅ Always allow guild owner
  if (interaction.guild.ownerId === interaction.user.id) return true;

  // ✅ (Optional) Allow bot owner
  if (interaction.user.id === process.env.BOT_OWNER_ID) return true;

  const data = await CommandPermissions.findOne({
    guildId: interaction.guildId,
    command: commandName
  });

  if (!data || data.allowedRoles.length === 0) return true;

  const userRoles = interaction.member.roles.cache.map(role => role.id);
  return data.allowedRoles.some(roleId => userRoles.includes(roleId));
}

module.exports = { hasCommandPermission };