const { EmbedBuilder } = require("discord.js");
const BumpReminder = require("../models/BumpReminder");

module.exports = (client) => {
  setInterval(async () => {
    const reminders = await BumpReminder.find();

    reminders.forEach(async (reminder) => {
      const now = Date.now();
      const nextBump = new Date(reminder.lastBump).getTime() + 7200000; // 2 hours

      if (now >= nextBump) {
        const guild = await client.guilds.fetch(reminder.guildId).catch(() => null);
        if (!guild) return;

        const channel = guild.channels.cache.get(reminder.channelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
          .setTitle(reminder.reminderTitle)
          .setDescription(reminder.reminderDesc)
          .setColor(0x7289da)
          .setTimestamp();

        await channel.send({ embeds: [embed] });

        reminder.lastBump = new Date();
        await reminder.save();
      }
    });
  }, 60 * 1000); // check every minute
};