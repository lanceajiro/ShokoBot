const fs = require('fs');
const bot = global.client.bot;
const log = require('./log');
const data = require('./database');

const request = (bot, chatId, userId) => {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Agree', callback_data: `auth_agree_${userId}` },
                    { text: 'Disagree', callback_data: `auth_disagree_${userId}` }
                ]
            ]
        }
    };

    // Read the contents of manual.txt
    fs.readFile(__dirname + '/manual.txt', 'utf8', (err, manualContent) => {
        if (err) {
            log.erro('Error reading manual.txt: ' + err.message);
            bot.sendMessage(chatId, "An error occurred while loading the bot's policy. Please try again later.");
            return;
        }

        // Send the manual content first, followed by the policy
        const policyMessage = `
By using this bot, you agree to the following policy:

${manualContent}`;

        bot.sendMessage(chatId, policyMessage, options);
    });
};

const response = (bot, callbackQuery) => {
    const userId = callbackQuery.from.id.toString();
    const chatId = callbackQuery.message.chat.id;
    const dataParts = callbackQuery.data.split('_');
    const action = dataParts[1];
    const targetUserId = dataParts[2];

    if (userId !== targetUserId) {
        bot.answerCallbackQuery(callbackQuery.id, { text: 'This action is not for you.' });
        return;
    }

    let responseText;
    if (action === 'agree') {
        const userLog = data.addUser(userId);
        if (userLog) log.data(userLog); // Log only if the user was newly added
        responseText = 'Thank you for agreeing! You have been registered.';
    } else if (action === 'disagree') {
        responseText = 'You disagreed with the policy. Your data will not be recorded.';
    }

    bot.editMessageText(responseText, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
    });
};

module.exports = {
    request,
    response
};
