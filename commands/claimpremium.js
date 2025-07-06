const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claimpremium")
    .setDescription("Link your Patreon to unlock Pandoryx premium features!"),
  async execute(interaction) {
    const clientId = process.env.PATREON_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.PATREON_REDIRECT_URI);

    // Use a real space in the scopes array, then encode them
    const scopes = [
      "identity",
      "identity.memberships",
      "identity.social_connections"
    ].join(" ");

    const loginUrl =
      `https://www.patreon.com/oauth2/authorize?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${encodeURIComponent(scopes)}`;

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