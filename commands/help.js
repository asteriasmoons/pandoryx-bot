const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help for all commands'),

  async execute(interaction) {
    // Example: List of commands/pages (replace with your actual commands)
    const helpPages = new EmbedBuilder()
	.setTitle('**Help Pages**')
	.setColor('#ff51fe')
	.setDescription('This is the help menu for the bot. All commands are listed here and are clickable, so you can use them immediately by selecting them. Commands are organized into groups, and each page of the help menu explains what each command does within its group, making it easy to find and understand the features you need.')
	.addFields(
		{ name: '</help:1375869926400725152>', value: 'The help command with pages.' },
        { name: '', value: 'Clears an amount of messages in a channel.' }
	)
	.setFooter({ text: 'Pandoryx Help Pages' });

	const embedCmds = new EmbedBuilder()
	.setTitle('**Embed Commands**')
	.setColor('#ff51fe')
	.addFields(
		{ name: '</embed create:1374808928730222612>', value: 'Create a new embed message' },
		{ name: '</embed edit:1374808928730222612>', value: 'Edit an existing embed you created by name.' },
		{ name: '</embed delete:1374808928730222612>', value: 'Delete an embed you created by name.' },
		{ name: '</embed send:1374808928730222612>', value: 'Send an embed you created in the channel you send this command by name.' },
		{ name: '</embed view:1374808928730222612>', value: 'View an embed you created by name.' },
		{ name: '</embed list:1374808928730222612>', value: 'Send in a channel to view a list of embeds created in the server by names.' }
	)
	.setFooter({ text: 'Pandoryx Help Pages' });

	const noteCmds = new EmbedBuilder()
	.setTitle('**User Note Commands**')
	.setColor('#ff51fe')
	.addFields(
		{ name: '</note add:1374831632451637260>', value: 'Add a note to a user.' },
		{ name: '</note view:1374831632451637260>', value: 'View a note for a user.' },
		{ name: '</note remove:1374831632451637260>', value: 'Remove a user note by index number.' }
	)
	.setFooter({ text: 'Pandoryx Help Pages' });

	const warnCmds = new EmbedBuilder()
	.setTitle('**Warning Commands**')
	.setColor('#ff51fe')
	.addFields(
		{ name: '</warn add:1374900166108254260>', value: 'Adds a warning to the user and DMs the user.' },
		{ name: '</warn view:1374900166108254260>', value: 'View all warnings for a user.' },
		{ name: '</warn remove:1374900166108254260>', value: 'Remove a warning from a user with the index number from view.' }
	)
	.setFooter({ text: 'Pandoryx Help Pages' });

	const banCmds = new EmbedBuilder()
	.setTitle('**Ban Commands**')
	.setColor('#ff51fe')
	.addFields(
		{ name: '</ban add:1374937047911104534>', value: 'Adds a ban on a user using the users ID.' },
		{ name: '</ban remove:1374937047911104534>', value: 'Removes a user ban.' },
		{ name: '</ban list:1374937047911104534>', value: 'Get a list of the server bans.' },
		{ name: '</ban view:1374937047911104534>', value: 'View a ban case by its index number.' }
	)
	.setFooter({ text: 'Pandoryx Help Pages' });

	const kickCmds = new EmbedBuilder()
	.setTitle('**Kick Commands**')
	.setColor('#ff51fe')
	.addFields(
		{ name: '</kick add:1375110488551329945>', value: 'Kick a user and add a case to your servers kick list.' },
		{ name: '</kick list:1375110488551329945>', value: 'Get a list of the kick cases in the server.' },
		{ name: '</kick view:1375110488551329945>', value: 'View a kick case by its index number.' },
		{ name: '</kick remove:1375110488551329945>', value: 'Remove a kick case from the server' }
	)
	.setFooter({ text: 'Pandoryx Help Pages' });

	const autoRoleCmds = new EmbedBuilder()
	.setTitle('**Autorole Commands**')
	.setColor('#ff51fe')
	.addFields(
		{ name: '</autorole add:1375172777962766337>', value: 'Add an autorole to the list of autoroles.' },
		{ name: '</autorole view:1375172777962766337>', value: 'View all of the servers autoroles.' },
		{ name: '</autorole remove:1375172777962766337>', value: 'Remove an autorole.' }
	)
	.setFooter({ text: 'Pandoryx Help Pages' });

	const timeoutCmds = new EmbedBuilder()
	.setTitle('**Timeout Commands**')
	.setColor('#ff51fe')
	.addFields(
		{ name: '</timeout add:1375241154869858367>', value: 'Adds a timeout to the specified user.' },
		{ name: '</timeout remove:1375241154869858367>', value: 'Removes a timeout from the specified user.' },
		{ name: '</timeout list:1375241154869858367>', value: 'Fetch a list of timeouts in the server.' },
		{ name: '</timeout view:1375241154869858367>', value: 'View a timeout case by index number and user.' }
	)
	.setFooter({ text: 'Pandoryx Help Pages' });

    const reactionRoleCmds = new EmbedBuilder()
    .setTitle('**Reaction Role Commands**')
    .setColor('#ff51fe')
    .addFields(
        { name: '</reactionrole create:1376019124861272134>', value: 'Creates a reaction role text or embed menu' },
        { name: '</reactionrole add:1376019124861272134>', value: 'Add a role and emoji to your panel you created' },
        { name: '</reactionrole remove:1376019124861272134>', value: 'Remove a role and emoji from the panel you created by name' },
        { name: '</reactionrole delete:1376019124861272134>', value: 'Delete a reaction role panel you created by name.' },
        { name: '</reactionrole list:1376019124861272134>', value: 'List all reaction role panels you have created and their names.' }
    )
    .setFooter({ text: 'Pandoryx Help Pages' });

	const ticketCmds = new EmbedBuilder()
	.setTitle('**Ticket Commands**')
	.setColor('#ff51fe')
    .addFields(
        { name: '</ticketpanel create:1384207275031265300>', value: 'Create a ticket panel using buttons and select menus' },
        { name: '</ticketpanel edit:1384207275031265300>', value: 'Edit a ticket panel by name using the same buttons and select menus ui as the creation process' },
        { name: '</ticketpanel delete:1384207275031265300>', value: 'Delete a ticket panel you created by name' },
        { name: '</ticketpanel list:1384207275031265300>', value: 'List all the ticket panels youve created and their names' },
        { name: '</ticketpanel post:1384207275031265300>', value: 'Post a ticket panel to a channel of your choice.' },
        { name: '</ticketpanel setrole:1384207275031265300>', value: 'Set the role to be pinged upon ticket opening such as @mods' },
        { name: '</ticketpanel settranscriptchannel:1384207275031265300>', value: 'Set the channel for transcripts to go to' }
    )
    .setFooter({ text: 'Pandoryx Help Pages' });

    const logCmds = new EmbedBuilder()
    .setTitle('**Log Commands**')
    .setColor('#ff51fe')
    .addFields(
        { name: '</log config:1385287365211455549>', value: 'Sends you the log config panel to configure events' },
        { name: '</log view:1385287365211455549>', value: 'View how your event logs are setup' }
    )
    .setFooter({ text: 'Pandoryx Help Pages' });

    const rolePanelCmds = new EmbedBuilder()
    .setTitle('**Role Panel Commands**')
    .setColor('#ff51fe')
    .addFields(
        { name: '</rolepanel create:1385699654213173298>', value: 'Create a role panel with either buttons or select menus' },
        { name: '</rolepanel addrole:1385699654213173298>', value: 'Add roles, emojis, label to your role panel by name' },
        { name: '</rolepanel publish:1385699654213173298>', value: 'Publish your role panel to a channel' },
        { name: '</rolepanel editembed:1385699654213173298>', value: 'Edit the panel embed that your buttons or menus are attached to' },
        { name: '</rolepanel list:1385699654213173298>', value: 'List all of the role panels youve created by name' },
        { name: '</rolepanel delete:1385699654213173298>', value: 'Delete a role panel' }
    )
    .setFooter({ text: 'Pandoryx Help Pages' });

    const stickyCmds = new EmbedBuilder()
    .setTitle('**Sticky Commands**')
    .setColor('#ff51fe')
    .addFields(
        { name: '</sticky embed create:1385805709748342855>', value: 'Create a sticky embed message' },
        { name: '</sticky embed edit:1385805709748342855>', value: 'Edit a sticky embed message you created by name' },
        { name: '</sticky embed send:1385805709748342855>', value: 'Choose which sticky embed to send and which channel to send it to' },
        { name: '</sticky embed delete:1385805709748342855>', value: 'Delete a sticky embed using its name and the channel its in' },
        { name: '</sticky embed remove:1385805709748342855>', value: 'Removes a sticky embed without deleting it' }
    )
    .setFooter({ text: 'Pandoryx Help Pages' });

    const levelCmds = new EmbedBuilder()
    .setTitle('**Level Commands**')
    .setColor('#ff51fe')
    .addFields(
        { name: '</level profile:1386077143494168586>', value: 'Shows your leveling profile in a nice embed message' },
        { name: '</level role-add:1386077143494168586>', value: 'Add a role for a specific level to be awarded to users of that level' },
        { name: '</level role-remove:1386077143494168586>', value: 'Remove a role for a specific level' },
        { name: '</level role-list:1386077143494168586>', value: 'Lists all the roles youve assigned to a level' },
        { name: '</level reset:1386077143494168586>', value: 'Reset someones level with this command (for admins only)' },
        { name: '</level set-announcement:1386077143494168586>', value: 'Admins can set announcement message for levels using text and placeholders' }
    )
    .setFooter({ text: 'Pandoryx Help Pages' });

    const lvlconfigCmds = new EmbedBuilder()
    .setTitle('**Level Config Commands**')
    .setColor('#ff51fe')
    .addFields(
        { name: '</levelconfig set-thresholds:1386077143494168587>', value: 'Set the amount of messages a user must send to reach each level' },
        { name: '</levelconfig view-thresholds:1386077143494168587>', value: 'View the thresholds set for your server' },
        { name: '</levelconfig reset-thresholds:1386077143494168587>', value: 'Reset amount of messages/thresholds back to default' }
    )
    .setFooter({ text: 'Pandoryx Help Pages' });

    const reminderCmds = new EmbedBuilder()
    .setTitle('**Reminder Commands**')
    .setColor('#ff51fe')
    .addFields(
        { name: '</reminder create:1386367362734882937>', value: 'Create an interval reminder, this commands sends a ui to configure' },
        { name: '</reminder list:1386367362734882937>', value: 'List all active reminders in your server by name' },
        { name: '</reminder edit:1386367362734882937>', value: 'Edit an existing reminder by name with the same ui as the create command' },
        { name: '</reminder delete:1386367362734882937>', value: 'Delete a reminder by name from your server' },
        { name: '</reminder timezone:1386367362734882937>', value: 'Set your timezone for reminders in your server.' }
    )
    .setFooter({ text: 'Pandoryx Help Pages' });

	const embeds = [helpPages, embedCmds, noteCmds, warnCmds, banCmds, kickCmds, autoRoleCmds, timeoutCmds, reactionRoleCmds, ticketCmds, logCmds, rolePanelCmds, stickyCmds, levelCmds, lvlconfigCmds, reminderCmds];

    // Embed navigation logic
    let currentPage = 0;
    const totalPages = embeds.length;

        // --- 3. Function to Generate Buttons Dynamically ---
        const generateButtonRow = (pageIndex) => {
            const row = new ActionRowBuilder();

            // Back Button
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('back') // Your existing custom ID
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary)
					.setEmoji('1370443196403810345')
                    .setDisabled(pageIndex === 0) // Disable if on the first page
            );

            // Next Button
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('next') // Your existing custom ID
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
					.setEmoji('1370443137750667495')
                    .setDisabled(pageIndex === totalPages - 1) // Disable if on the last page
            );

            return row;
        };

        // --- 4. Send the Initial Reply ---
        const message = await interaction.reply({
            embeds: [embeds[currentPage]],
            components: [generateButtonRow(currentPage)],
            fetchReply: true // Important to get the message object for the collector
        });

        // --- 5. Create the Message Component Collector ---
        const collector = message.createMessageComponentCollector({
            // Filter to ensure only the original command user can interact
            // and that the customId matches your buttons
            filter: (i) => (i.customId === 'back' || i.customId === 'next') && i.user.id === interaction.user.id,
            time: 300000 // 5 minutes 
        });

        collector.on('collect', async i => {
            // The filter should already prevent other users, but this is an explicit check if you remove/change the filter
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Only the command user can use these buttons!', ephemeral: true });
            }

            if (i.customId === 'next') {
                if (currentPage < totalPages - 1) {
                    currentPage++;
                }
            } else if (i.customId === 'back') {
                if (currentPage > 0) {
                    currentPage--;
                }
            }

            // Update the message with the new page and buttons
            await i.update({
                embeds: [embeds[currentPage]],
                components: [generateButtonRow(currentPage)]
            });
        });

        collector.on('end', async (collected, reason) => {
            // When the collector stops (e.g., due to timeout), disable the buttons
            const disabledRow = new ActionRowBuilder();
            disabledRow.addComponents(
                new ButtonBuilder()
                    .setCustomId('back_disabled')
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary)
					.setEmoji('1370443196403810345')
                    .setDisabled(true)
            );
            disabledRow.addComponents(
                new ButtonBuilder()
                    .setCustomId('next_disabled')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
					.setEmoji('1370443137750667495')
                    .setDisabled(true)
            );

            // This whole block goes inside your: collector.on('end', async (collected, reason) => { ... });
            // Make sure 'disabledRow', 'interaction', and 'message' variables are defined and accessible here.
            // 'message' is the object from your initial: await interaction.reply({ ..., fetchReply: true });

        try {
        // 1. Try to fetch the channel using the channelId from the original message
        const channel = await interaction.client.channels.fetch(message.channelId).catch(err => {
        // Log if channel fetch itself fails, then return null to be handled below
        console.warn(`Failed to fetch channel ${message.channelId} directly: ${err.message}`);
        return null;
    });

      if (channel && channel.isTextBased()) { // Works for guild text channels and DM channels
        // 2. Try to fetch the message itself from the (potentially newly) fetched channel
      const freshMessage = await channel.messages.fetch(message.id).catch(err => {
        // Log if message fetch fails, then return null
      if (err.code !== 10008) { // Don't log an error if it's just "Unknown Message"
      console.warn(`Failed to fetch message ${message.id} from channel ${channel.id} : ${err.message}`);
            }
            return null;
        });

        if (freshMessage) {
            // 3. Now, edit the fresh (and confirmed existing) message object
            await freshMessage.edit({ components: [disabledRow] });
            console.log(`Successfully disabled buttons for help message ${freshMessage.id}`);
        } else {
            // This means channel.messages.fetch(message.id) returned null (or threw an error caught by its .catch)
            // It implies the message was likely deleted.
            console.log(`Help command message (ID: ${message.id}) could not be found in channel ${message.channelId} when collector ended. Might have been deleted by a user.`);
		}
    } else {
        // This means client.channels.fetch(message.channelId) returned null or the channel isn't text-based.
        console.log(`Channel (ID: ${message.channelId}) for help command message could not be fetched, is not text-based, or bot lost access when collector ended.`);
    }
} catch (error) { // This single catch block will handle errors from the 'try' block above
    if (error.code === 10008) { // Unknown Message (already handled by freshMessage being null, but good to have as a fallback)
        console.log(`Help command message (ID: ${message.id}) was already deleted before buttons could be disabled (Error 10008).`);
    } else if (error.code === 50007) { // Cannot send messages to this user (relevant for DMs)
        console.warn(`Could not edit message in DM for user ${interaction.user.id} (Message ID: ${message.id}, Channel: ${message.channelId}). They might have DMs closed or blocked the bot.`);
    } else if (error.code === 50001) { // Missing Access (e.g., bot kicked, channel permissions changed)
        console.error(`Missing access to channel ${message.channelId} when trying to disable help buttons (Error 50001 for Message ID: ${message.id}).`);
    } else if (error.code === 'ChannelNotCached' || (error.message && error.message.includes('ChannelNotCached'))) {
        console.warn(`Encountered ChannelNotCached for ${message.channelId} despite 
fetch attempt. This can happen if the channel truly became inaccessible. (Error: ${error.message}, Message ID: ${message.id})`);
    } else {
        // Log other unexpected errors
        console.error(`Unexpected error trying to edit message after help collector timed out (Message ID: ${message.id}, Channel ID: ${message.channelId}):`, error);
    }
}
    
// This whole block goes inside your: collector.on('end', async (collected, reason) => { ... });
// Make sure 'disabledRow', 'interaction', and 'message' variables are defined and accessible here.
// 'message' is the object from your initial: await interaction.reply({ ..., fetchReply: true });

// --- START OF THE TRY BLOCK ---
try {
  // 1. Try to fetch the channel using the channelId from the original message
  const channel = await interaction.client.channels.fetch(message.channelId).catch(err => {
      console.warn(`[CollectorEnd] Failed to fetch channel ${message.channelId} directly: ${err.message}`);
      return null; // Return null to be handled by the 'if (channel ...)' check below
  });

  if (channel && channel.isTextBased()) { // Works for guild text channels and DM channels
      // 2. Try to fetch the message itself from the (potentially newly) fetched channel
      const freshMessage = await channel.messages.fetch(message.id).catch(err => {
          // Don't log an error if it's just "Unknown Message" (10008), as it means the message was deleted.
          if (err.code !== 10008) {
              console.warn(`[CollectorEnd] Failed to fetch message ${message.id} from channel ${channel.id}: ${err.message}`);
          }
          return null; // Return null if message fetch fails
      });

      if (freshMessage) {
          // 3. Now, edit the fresh (and confirmed existing) message object
          await freshMessage.edit({ components: [disabledRow] }); // Ensure 'disabledRow' is defined
          console.log(`[CollectorEnd] Successfully disabled buttons for help message ${freshMessage.id}`);
      } else {
          // This means channel.messages.fetch(message.id) returned null (or threw an error caught by its .catch)
          // It implies the message was likely deleted by a user or another process.
          console.log(`[CollectorEnd] Help command message (ID: ${message.id}) could not be found in channel ${message.channelId}. Might have been deleted.`);
      }
  } else {
      // This means client.channels.fetch(message.channelId) returned null or the channel isn't text-based.
      console.log(`[CollectorEnd] Channel (ID: ${message.channelId}) for help message could not be fetched, is not text-based, or bot lost access.`);
  }
// --- END OF THE TRY BLOCK ---
} catch (error) { // <<< THIS CATCH NOW CORRECTLY FOLLOWS THE COMPLETED TRY BLOCK
  if (error.code === 10008) { // Unknown Message (This case is mostly handled by freshMessage being null, but good as a fallback)
      console.log(`[CollectorEnd] Help command message (ID: ${message.id}) was already deleted before buttons could be disabled (Error 10008).`);
  } else if (error.code === 50007) { // Cannot send messages to this user (relevant for DMs)
      console.warn(`[CollectorEnd] Could not edit message in DM for user ${interaction.user.id} (Message ID: ${message.id}, Channel: ${message.channelId}). They might have DMs closed or blocked the bot.`);
  } else if (error.code === 50001) { // Missing Access (e.g., bot kicked, channel permissions changed)
      console.error(`[CollectorEnd] Missing access to channel ${message.channelId} when trying to disable help buttons (Error 50001 for Message ID: ${message.id}).`);
  } else if (error.code === 'ChannelNotCached' || (error.message && error.message.includes('ChannelNotCached'))) {
      console.warn(`[CollectorEnd] Encountered ChannelNotCached for ${message.channelId} despite fetch attempt. (Error: ${error.message}, Message ID: ${message.id})`);
  } else {
      // Log other unexpected errors
      console.error(`[CollectorEnd] Unexpected error trying to edit message after help collector timed out (Message ID: ${message.id}, Channel ID: ${message.channelId}):` ,error);
      }
    }
  });
    }
  }
// --- END OF THE CATCH BLOCK ---