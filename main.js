const TelegramBot = require('node-telegram-bot-api');
const log = require('./includes/system/log');
const display = require('./includes/system/display');
const { logMessage } = require('./includes/system/console');

// Load configuration
global.config = require('./config.json');
if (!global.config.token) {
    log.warn('Telegram bot token is not defined in the configuration.');
    process.exit(1);
}

// Initialize global variables
global.client = {
    commands: new Map(),
    buttons: {},
    aliases: new Map(),
    reply: new Map(),
    restrictAi: null,
    info: null,
    bot: null
};
global.data = {
    groups: new Map(),
    users: new Map()
};
global.package = require('./package.json');

// Create and configure the bot instance
const bot = new TelegramBot(global.config.token, { polling: true });
global.client.bot = bot;

const data = require('./includes/system/database');
const authorization = require('./includes/system/authorization');
const { listen } = require('./includes/listen');
const { meme } = require('./includes/system/meme');
const { startServer } = require('./includes/system/server');

// Function to handle individual message processing
async function processMessage(msg) {
    // Log incoming message
    logMessage(msg);

    // Process group data
    if (['group', 'supergroup'].includes(msg.chat.type)) {
        const groupLog = data.addGroup(msg.chat.id);
        if (groupLog) log.data(groupLog); // Log only if the group was newly added
    }

    // Check if the user is already in the database
    if (!global.data.users.has(msg.from.id.toString())) {
        // If not, send the authorization request
        authorization.request(bot, msg.chat.id, msg.from.id);
        return; // Stop further processing until the user is authorized
    }

    // Handle ranking up
    const fullName = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ');
    const rankUpMessage = data.rankUp(msg.from.id, fullName);
    if (rankUpMessage) bot.sendMessage(msg.chat.id, rankUpMessage);

    // Process the message with the bot's command handler
    await listen({ bot, chatId: msg.chat.id, userId: msg.from.id, msg, data });

    // Save user and group data
    data.saveGroups();
    data.saveUsers();
}

// Function to set up bot processes
function setupBot() {
    // Load initial data
    data.loadGroups();
    data.loadUsers();

    // Handle incoming messages
    bot.on('message', (msg) => processMessage(msg).catch((error) => log.erro('Error handling message: ' + error.message)));

    // Handle callback queries for authorization
    bot.on('callback_query', (callbackQuery) => authorization.response(bot, callbackQuery));

    // Start the meme cron job
    meme({ bot });
}

// Initialize the bot
(async () => {
    try {
        await display.showInfo();
        await startServer();
        setupBot();
    } catch (error) {
        log.erro('Error initializing the bot: ' + error.message);
        process.exit(1);
    }
})();
