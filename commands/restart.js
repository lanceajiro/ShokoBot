exports.config = {
    name: 'restart',
    author: 'Lance Cochangco',
    access: 'admin',  // Restrict to admins or authorized users
    description: 'Restart the bot.',
    category: 'Utility',
    usage: ['']
};

// Sleep function with a promise-based delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.initialize = async function ({ bot, chatId }) {
    try {
        // Notify that the bot is restarting
        await bot.sendMessage(chatId, 'Restarting the bot...');

        // Introduce a brief delay to ensure the message is sent
        await sleep(2000);

        // Exit the process to trigger a restart (handled by the hosting platform)
        process.exit(0);
    } catch (error) {
        console.error("Error during restart:", error);
        // Notify the user about the error
        await bot.sendMessage(chatId, `Error during restart: ${error.message}`);
    }
};
