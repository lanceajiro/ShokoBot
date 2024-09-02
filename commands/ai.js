const axios = require('axios');

exports.config = {
    name: 'ai',
    author: 'Lance Cochangco',
    access: 'anyone',
    description: 'GPT-4o model',
    category: 'AI',
    usage: ['[query]']
};

exports.initialize = async function ({ bot, chatId, userId, msg, usages, args }) {
    try {
        // Extract the prompt from the message
        const prompt = args.join(' '); // Removes the command part and joins the rest as the prompt

        if (!prompt) {
            // If no prompt is provided, send a message back to the user
            await usages();
            return;
        }

        // Send typing animation
        await bot.sendChatAction(chatId, 'typing');

        // Send a waiting response message
        const waitingMessage = await bot.sendMessage(chatId, 'Please wait, I am processing your request...');

        // Make a GET request to the API with the provided prompt
        const apiUrl = `https://ajiro-api.onrender.com/gpt4o?context=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl);

        if (response.data.status) {
            // Edit the waiting message with the response from the API
            await bot.editMessageText(response.data.response, { chat_id: chatId, message_id: waitingMessage.message_id });
        } else {
            await bot.editMessageText('Failed to retrieve a response from the API.', { chat_id: chatId, message_id: waitingMessage.message_id });
        }
    } catch (error) {
        console.error("Error executing command:", error);
        await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
    }
};
