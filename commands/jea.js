const axios = require('axios');

exports.config = {
    name: 'jea',
    author: 'Lance Cochangco',
    access: 'anyone',
    description: 'Jea, your sweet and lovely virtual girlfriend.',
    category: 'AI',
    usage: ['[query]']
};

exports.initialize = async function ({ bot, chatId, userId, msg, usages, args }) {
    try {
        // Extract the prompt from the message
        const prompt = args.join(' '); // Joins the remaining text as the prompt

        if (!prompt) {
            // If no prompt is provided, send a message back to the user
            await usages();
            return;
        }

        // Send typing animation
        await bot.sendChatAction(chatId, 'typing');

        // Send a waiting response message
        const waitingMessage = await bot.sendMessage(chatId, 'Jea is thinking...');

        // Make a GET request to the API with the provided prompt and userId as id
        const apiUrl = `https://ajiro-api.onrender.com/jea?ask=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl);

        if (response.data.results) {
            // Edit the waiting message with the response from the API
            await bot.editMessageText(response.data.results, { chat_id: chatId, message_id: waitingMessage.message_id });
        } else {
            await bot.editMessageText('Failed to retrieve a response from Jea.', { chat_id: chatId, message_id: waitingMessage.message_id });
        }
    } catch (error) {
        console.error("Error executing command:", error);
        await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
    }
};
