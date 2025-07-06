const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium")
    .setDescription("Learn how to unlock Pandoryx premium features!"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle("Pandoryx Premium")
      .setDescription(
        `✨ Unlock premium features by supporting us on [Patreon](https://patreon.com/asteriasmoons)!
        
**Steps:**
1. [Subscribe to the Patreon tier here](https://patreon.com/asteriasmoons).
2. Link your Discord account on Patreon’s [Connections page](https://www.patreon.com/settings/apps).
3. Return here and run \`/claimpremium\` to unlock your perks!
        `
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
