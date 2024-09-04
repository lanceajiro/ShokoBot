exports.config = {
    name: 'blackbox',
    aliases: ["bb"],
    author: "Who's Deku",
    access: 'anyone',
    description: 'AI powered by Blackbox',
    category: 'AI',
    usage: '[ask]',
};

exports.initialize = async function ({ bot, chatId, userId, msg, usages, args }) {
    const axios = require('axios');
    let query = args.join(' ');  // Extract the query from the message

    if (!query) {
        return await usages();
    }

    try {
        // Send an initial message indicating that the search is in progress
        let sentMessage = await bot.sendMessage(chatId, 'Searching for the answer, please wait...');
        let messageId = sentMessage.message_id; // Get the message ID of the sent message

        const url = 'https://useblackbox.io/chat-request-v4';
        const data = {
            textInput: query,
            allMessages: [{ user: query }],
            stream: '',
            clickedContinue: false,
        };

        // Send the request to the Blackbox API
        const res = await axios.post(url, data);
        const response = res.data.response[0][0];

        // Edit the initial message to include the API response
        await bot.editMessageText(response, {
            chat_id: chatId,
            message_id: messageId,
        });
    } catch (error) {
        console.error("Error executing command:", error);
        // Edit the message to indicate an error occurred
        await bot.editMessageText(`An error occurred: ${error.message}`, {
            chat_id: chatId,
            message_id: messageId,
        });
    }
};
