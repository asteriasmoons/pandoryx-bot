const mongoose = require("mongoose");

const BumpReminderSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true }, // <--- now unique!
  channelId: String,
  lastBump: Date,
  reminderTitle: { type: String, default: "Time to Bump!" },
  reminderDesc: {
    type: String,
    default: "Use `/bump` to bump your server on Disboard!",
  },
  pingRoleId: { type: String, default: null },
  reminderSent: { type: Boolean, default: false },
  reminderDisabled: { type: Boolean, default: false }, // <--- Added
});

// (Optional: Ensure index is created in MongoDB for old collections)
BumpReminderSchema.index({ guildId: 1 }, { unique: true });

module.exports = mongoose.model("BumpReminder", BumpReminderSchema);
