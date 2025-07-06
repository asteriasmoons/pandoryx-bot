const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claimpremium")
    .setDescription("Link your Patreon to unlock Pandoryx premium features!"),

  async execute(interaction) {
    // Construct the login link
    const clientId = process.env.PATREON_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.PATREON_REDIRECT_URI);

    const loginUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=identity%20identity.memberships`;

    await interaction.reply({
      content: `🔗 **Link your Patreon to unlock premium!**\n[Click here to log in with Patreon](${loginUrl})\n\nOnce you're done, you can access all premium features!`,
      ephemeral: true,
    });
  }
};