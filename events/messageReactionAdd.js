const ReactionRoleMessage = require('../models/ReactionRoleMessage');

// Helper: Get emoji key for both unicode and custom
function getEmojiKey(emoji) {
  return emoji.id ? emoji.id : emoji.name;
}

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    // Double-check: reaction.message.guild exists (for DMs, etc.)
    if (!reaction.message.guild) return;

    const data = await ReactionRoleMessage.findOne({ messageId: reaction.message.id });
    if (!data) return;

    const emojiKey = getEmojiKey(reaction.emoji);
    const roleId = data.emojiRoleMap[emojiKey];
    if (!roleId) return;

    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    await member.roles.add(roleId).catch(() => {});
  }
};