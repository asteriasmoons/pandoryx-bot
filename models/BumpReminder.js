const mongoose = require("mongoose");

const BumpReminderSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  lastBump: Date,
  reminderTitle: { type: String, default: "Time to Bump!" },
  reminderDesc: {
    type: String,
    default: "Use `/bump` to bump your server on Disboard!",
  },
  pingRoleId: { type: String, default: null },
});

module.exports = mongoose.model("BumpReminder", BumpReminderSchema);
