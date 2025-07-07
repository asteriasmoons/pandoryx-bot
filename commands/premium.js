// commands/premium.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium")
    .setDescription("Learn how to unlock Pandoryx premium features!"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Pandoryx Premium")
      .setColor(0x663399)
      .setDescription(
        `
🌟 **Unlock powerful premium features for your server!**

Visit our [Server Shop](https://discord.com/servers/elyxia-bots-support-1367981386862034954) to get started.

Premium gives you:
• More customization
• Early access to new features
• Priority support

**How It Works**
When you go join a membership tier, you will receive a role in which the bot checks for when running premium commands and this will allow you premium access to those commands!

*Thank you for supporting Pandoryx!*
      `
      )
      .setFooter({ text: "Need help? Use /support or join our help server." });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
