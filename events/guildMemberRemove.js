// events/guildMemberRemove.js
const sendWelcomeOrLeave = require("../utils/sendWelcomeLeave");

module.exports = {
  name: "guildMemberRemove",
  /**
   * @param {GuildMember} member
   */
  async execute(member) {
    console.log(`${member.user.tag} left the server!`);
    try {
      await sendWelcomeOrLeave(member, "leave");
    } catch (err) {
      console.error(`Error sending leave message: ${err}`);
    }
  },
};
