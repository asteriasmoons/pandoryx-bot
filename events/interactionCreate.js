// interactionCreate.js 
const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // 1. Slash Commands (Chat Input)
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) {
                    return interaction.reply({ content: '❌ Command not found.', ephemeral: true });
                }
                await command.execute(interaction, client);
            }

            // 2. Context Menu Commands (User or Message)
            else if (interaction.isContextMenuCommand && interaction.isContextMenuCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) {
                    return interaction.reply({ content: '❌ Command not found.', ephemeral: true });
                }
                await command.execute(interaction, client);
            }

            // 3. Button Interactions
            else if (interaction.isButton()) {
                // Example: route by customId prefix
                const [buttonName, ...args] = interaction.customId.split(':');
                // You can have a buttonHandlers collection or handle here directly
                if (client.buttonHandlers && client.buttonHandlers.has(buttonName)) {
                    await client.buttonHandlers.get(buttonName)(interaction, client, args);
                } else {
                    await interaction.reply({ content: '⚠️ Unknown button.', ephemeral: true });
                }
            }

            // 4. Select Menu Interactions
            else if (interaction.isAnySelectMenu()) {
                const [menuName, ...args] = interaction.customId.split(':');
                if (client.selectMenuHandlers && client.selectMenuHandlers.has(menuName)) {
                    await client.selectMenuHandlers.get(menuName)(interaction, client, args);
                } else {
                    await interaction.reply({ content: '⚠️ Unknown select menu.', ephemeral: true });
                }
            }

            // 5. Modal Submissions
            else if (interaction.isModalSubmit()) {
                const [modalName, ...args] = interaction.customId.split(':');
                if (client.modalHandlers && client.modalHandlers.has(modalName)) {
                    await client.modalHandlers.get(modalName)(interaction, client, args);
                } else {
                    await interaction.reply({ content: '⚠️ Unknown modal.', ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Interaction error:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '⚠️ There was an error handling this interaction!', ephemeral: true });
            } else {
                await interaction.reply({ content: '⚠️ There was an error handling this interaction!', ephemeral: true });
            }
        }
    },
};