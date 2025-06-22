// utils/reminderScheduler.js
const Reminder = require('../models/Reminder');
const { EmbedBuilder } = require('discord.js');
const chrono = require('chrono-node'); // <-- NEW: Use chrono-node!

// Helper to parse intervals like "1h", "2d", "15m"
function parseInterval(str) {
  if (!str) return null;
  const m = str.match(/^(\d+)\s*([smhdw])$/i);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return num * (multipliers[unit] || 0);
}

module.exports = function startReminderScheduler(client) {
  setInterval(async () => {
    const now = new Date();
    let reminders;
    try {
      reminders = await Reminder.find({});
    } catch (err) {
      console.error('[Reminders] DB error:', err);
      return;
    }

    for (const reminder of reminders) {
      // 1. Validate guild and channel still exist
      const guild = client.guilds.cache.get(reminder.guildId);
      if (!guild) continue;
      const channel = guild.channels.cache.get(reminder.channelId);
      if (!channel || !channel.isTextBased()) continue;

      // 2. Check if this reminder is due to send
      let intervalMs = parseInterval(reminder.interval);
      if (!intervalMs) continue; // skip if invalid interval

      // --- CHRONO: Robustly parse the startDate in case it's a string or Date
      let startDate;
      if (reminder.startDate instanceof Date) {
        startDate = reminder.startDate;
      } else if (typeof reminder.startDate === 'string') {
        startDate = chrono.parseDate(reminder.startDate);
      } else {
        startDate = null;
      }

      // If the startDate is still invalid, skip this reminder
      if (!startDate || isNaN(startDate.getTime())) {
        console.warn(`[Reminders] Invalid startDate for "${reminder.name}":`, reminder.startDate);
        continue;
      }

      // Next scheduled time
      let nextTime = startDate;
      if (reminder.lastSent) {
        nextTime = new Date(reminder.lastSent.getTime() + intervalMs);
      }

      // If a specific day of week is set, check if today matches
      if (reminder.dayOfWeek) {
        // E.g., "Monday", "Tuesday", etc.
        const today = now.toLocaleString('en-US', { weekday: 'long' });
        if (today.toLowerCase() !== reminder.dayOfWeek.toLowerCase()) continue;
      }

      // Due?
      if (now >= nextTime) {
        // 3. Build embed
        const embed = new EmbedBuilder()
          .setTitle(reminder.embedTitle || 'Reminder!')
          .setDescription(reminder.embedDescription || '')
          .setColor(reminder.embedColor || '#8757f2');

        // 4. Send
        try {
          await channel.send({
            content: reminder.ping || '',
            embeds: [embed]
          });
          console.log(`[Reminders] Sent reminder "${reminder.name}" in #${channel.name}`);
        } catch (sendErr) {
          console.error(`[Reminders] Could not send reminder "${reminder.name}":`, sendErr);
          continue;
        }

        // 5. Update lastSent in DB
        try {
          reminder.lastSent = now;
          await reminder.save();
          console.log(`[Reminders] Updated lastSent for "${reminder.name}"`);
        } catch (saveErr) {
          console.error(`[Reminders] Could not update lastSent for "${reminder.name}":`, saveErr);
        }
      }
    }
  }, 60000); // every 60 seconds
};