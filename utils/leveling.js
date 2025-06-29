// utils/leveling.js
const { EmbedBuilder } = require("discord.js");
const UserLevel = require("../models/UserLevel");
const GuildConfig = require("../models/GuildConfig");

const DEFAULT_THRESHOLDS = [0, 5, 10, 20, 40, 60, 80, 120, 180, 220];
const DEFAULT_LVLUP = "<@{userId}> leveled up to **Level {level}**! 🎉";

async function handleLeveling(message) {
  // Ignore bots or DMs
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  let userData = await UserLevel.findOne({ guildId, userId });
  if (!userData) {
    userData = await UserLevel.create({
      guildId,
      userId,
      messages: 0,
      level: 0,
    });
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

    // --- Build custom level-up message ---
    const template = config?.levelUpMessage || DEFAULT_LVLUP;
    const levelUpText = template
      .replaceAll("{userId}", userId)
      .replaceAll("{level}", newLevel)
      .replaceAll("{username}", message.author.username)
      .replaceAll("{mention}", `<@${userId}>`);

    // Level up announcement as embed
    const levelEmbed = new EmbedBuilder()
      .setColor(0x663399)
      .setTitle("Level Up!")
      .setDescription(levelUpText)
      .addFields({
        name: "Total Messages",
        value: `${userData.messages}`,
        inline: true,
      })
      .setTimestamp()
      .setThumbnail(message.author.displayAvatarURL?.());

    await message.channel.send({ embeds: [levelEmbed] });

    // Reward role
    const rewardRole = config?.levelRoles?.find((r) => r.level === newLevel);
    if (rewardRole) {
      try {
        const member = await message.guild.members.fetch(userId);
        await member.roles.add(rewardRole.roleId);

        // Optional: Announce role reward as embed
        const roleEmbed = new EmbedBuilder()
          .setColor(0x663399)
          .setDescription(
            `<@${userId}> has been awarded the role <@&${rewardRole.roleId}> for reaching Level ${newLevel}!`
          )
          .setTimestamp();
        await message.channel.send({ embeds: [roleEmbed] });
      } catch (err) {
        console.error(`Could not assign level role:`, err);
      }
    }
  } else {
    await userData.save();
  }
}

module.exports = { handleLeveling };
