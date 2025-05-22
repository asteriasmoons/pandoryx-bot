// index.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const UserKick = require('./models/UserKick'); // Adjust path as needed
const modLogger = require('./modLogger');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB!'))
.catch(err => console.error('MongoDB connection error:', err));

// Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMembers
    ]
});

// Commands collection (for slash commands)
client.commands = new Collection();

// Load commands (including from subfolders)
const commandsPath = path.join(__dirname, 'commands');
function loadCommands(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            loadCommands(filePath); // Recursively load subfolders
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}
loadCommands(commandsPath);

require('./events/guildMemberAdd')(client);
// Load events from /events folder
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.name && typeof event.execute === 'function') {
            // Pass agenda and client to events if needed
            client.on(event.name, (...args) => event.execute(...args, client));
            console.log(`Loaded event: ${event.name}`);
        }
    }
}

// Your existing client setup, requires, etc., would be above this

client.once('ready', async () => { // <<< Added 'async' here
    client.user.setPresence({
        activities: [
            { name: 'With more bots 💛', type: ActivityType.Streaming }
        ],
    });
    console.log(`Bot ${client.user.tag} is now ready!`);
    }); // <<< This is the closing of client.once('ready', async () => { ... })

client.login(process.env.TOKEN);