// index.js
require('dotenv').config();
const fs = require('fs');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Only if you need to read message content
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Commands collection (for slash commands)
client.commands = new Collection();

// Dynamically load event files from 'events' folder
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Ready event (in case you want to keep it in index.js)
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// Login to Discord
client.login(process.env.TOKEN);