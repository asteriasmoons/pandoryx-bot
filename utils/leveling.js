// utils/leveling.js

const UserLevel = require('../models/UserLevel');
const GuildConfig = require('../models/GuildConfig');

const DEFAULT_THRESHOLDS = [0, 5, 10, 25, 50, 100, 200];

async function handleLeveling(message) {
  // Ignore bots or DMs
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  let userData = await UserLevel.findOne({ guildId, userId });
  if (!userData) {
    userData = await UserLevel.create({ guildId, userId, messages: 0, level: 0 });
  }

  const config = await GuildConfig.findOne({ guildId });
  const thresholds = config?.levelThresholds || DEFAULT_THRESHOLDS;

  userData.messages += 1;

  let newLevel = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (userData.messages >= thresholds[i]) {
      newLevel = i;
    }
  }

  if (newLevel > userData.level) {
    userData.level = newLevel;
    await userData.save();

    // Level up announcement
    await message.channel.send(
      `<@${userId}> leveled up! They are now **Level ${newLevel}**! 🎉`
    );

    // Reward role
    const rewardRole = config?.levelRoles?.find(r => r.level === newLevel);
    if (rewardRole) {
      try {
        const member = await message.guild.members.fetch(userId);
        await member.roles.add(rewardRole.roleId);
      } catch (err) {
        console.error(`Could not assign level role:`, err);
      }
    }
  } else {
    await userData.save();
  }
}

module.exports = { handleLeveling };