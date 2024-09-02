const fs = require('fs');
const path = require('path');

// File paths for group and user databases
const groupDatabaseFilePath = path.join(__dirname, '../database/group.json');
const userDatabaseFilePath = path.join(__dirname, '../database/user.json');

// Ensure necessary directories and files exist
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const ensureFileExists = (filePath, defaultContent = '{}') => {
    if (!fs.existsSync(filePath)) {
        ensureDirectoryExists(path.dirname(filePath));
        fs.writeFileSync(filePath, defaultContent);
    }
};

ensureFileExists(groupDatabaseFilePath, JSON.stringify({}, null, 4));
ensureFileExists(userDatabaseFilePath, JSON.stringify({}, null, 4));

// Load group database
const loadGroups = () => {
    const groupsData = JSON.parse(fs.readFileSync(groupDatabaseFilePath, 'utf-8'));
    global.data.groups = new Map(Object.entries(groupsData).filter(([key]) => key.startsWith('-') && !isNaN(parseInt(key))));
};

// Load user database
const loadUsers = () => {
    const usersData = JSON.parse(fs.readFileSync(userDatabaseFilePath, 'utf-8'));
    global.data.users = new Map(Object.entries(usersData));
};

// Save group settings
const saveGroups = () => {
    const groupsData = Object.fromEntries(global.data.groups);
    fs.writeFileSync(groupDatabaseFilePath, JSON.stringify(groupsData, null, 4));
};

// Save user data
const saveUsers = () => {
    const usersData = Object.fromEntries(global.data.users);
    fs.writeFileSync(userDatabaseFilePath, JSON.stringify(usersData, null, 4));
};

// Add group to the database if it doesn't already exist, and log it only once
const addGroup = (chatId) => {
    if (!global.data.groups.has(chatId.toString())) {
        global.data.groups.set(chatId.toString(), { ai: false, bot: true, meme: false, event: true, onlyadmin: false });
        saveGroups();
        return `Group ${chatId} added to the database.`;
    }
    return null; // Return null if the group was already in the database
};

// Toggle a setting (ai, bot, meme, event) for a group
const toggle = (chatId, setting, state) => {
    if (global.data.groups.has(chatId.toString())) {
        const groupSettings = global.data.groups.get(chatId.toString());
        if (groupSettings.hasOwnProperty(setting)) {
            groupSettings[setting] = state; // Set the setting to true (on) or false (off)
            saveGroups();
            return `${setting.charAt(0).toUpperCase() + setting.slice(1)} has been ${state ? 'enabled' : 'disabled'} for this group.`;
        } else {
            return `Invalid setting. Available settings are: ai, bot, meme, event, onlyadmin.`;
        }
    } else {
        return `Group not found in the database.`;
    }
};

// Add user to the database if it doesn't already exist, and log it only once
const addUser = (userId) => {
    if (!global.data.users.has(userId.toString())) {
        global.data.users.set(userId.toString(), {
            exp: 0,
            level: 1,
            messageCount: 0
        });
        saveUsers();
        return `User ${userId} added to the database.`;
    }
    return null; // Return null if the user was already in the database
};

// Handle message counting and rank up
const rankUp = (userId, fullName) => {
    const user = global.data.users.get(userId.toString());
    if (user) {
        user.messageCount += 1;
        const requiredMessages = 5 * Math.pow(2, user.level - 1); // 5, 10, 20, 40...
        if (user.messageCount >= requiredMessages) {
            user.level += 1;
            user.exp += requiredMessages;
            user.messageCount = 0; // Reset message count after leveling up
            saveUsers();
            return `${fullName} has leveled up to level ${user.level}!`;
        }
        saveUsers();
    }
    return null;
};

module.exports = {
    loadGroups,
    loadUsers,
    saveGroups,
    saveUsers,
    addGroup,
    addUser,
    rankUp,
    toggle
};