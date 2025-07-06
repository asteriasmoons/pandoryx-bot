const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claimpremium")
    .setDescription("Link your Patreon to unlock Pandoryx premium features!"),
  async execute(interaction) {
    // -- These should be set as env vars in your bot project
    const clientId = process.env.PATREON_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.PATREON_REDIRECT_URI);

    // ✅ Make sure to include identity.social_connections in scope!
    const loginUrl =
      `https://www.patreon.com/oauth2/authorize?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=identity%20identity.memberships%20identity.social_connections`;

    await interaction.reply({
      content:
        `🔗 **Link your Patreon to unlock premium!**\n` +
        `[Click here to log in with Patreon](${loginUrl})\n\n` +
        `**Steps:**\n` +
        `1. [Subscribe to the Patreon tier here](https://www.patreon.com/YOURPATREON).\n` +
        `2. Link your Discord account on Patreon’s [Connections page](https://www.patreon.com/settings/apps).\n` +
        `3. Return here and run \`/claimpremium\` to unlock your perks!`,
      ephemeral: true,
    });
  },
};