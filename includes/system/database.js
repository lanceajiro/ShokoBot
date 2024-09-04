const fs = require('fs').promises;
const path = require('path');

const groupDatabaseFilePath = path.join(__dirname, '../database/group.json');
const userDatabaseFilePath = path.join(__dirname, '../database/user.json');

const ensureDirectoryExists = async (dir) => {
    await fs.mkdir(dir, { recursive: true });
};

const ensureFileExists = async (filePath, defaultContent = '{}') => {
    try {
        await fs.access(filePath);
    } catch {
        await ensureDirectoryExists(path.dirname(filePath));
        await fs.writeFile(filePath, defaultContent);
    }
};

const loadDatabase = async (filePath) => {
    const data = await fs.readFile(filePath, 'utf-8');
    return new Map(Object.entries(JSON.parse(data)));
};

const saveDatabase = async (filePath, data) => {
    await fs.writeFile(filePath, JSON.stringify(Object.fromEntries(data), null, 4));
};

const loadGroups = async () => {
    await ensureFileExists(groupDatabaseFilePath);
    global.data.groups = await loadDatabase(groupDatabaseFilePath);
};

const loadUsers = async () => {
    await ensureFileExists(userDatabaseFilePath);
    global.data.users = await loadDatabase(userDatabaseFilePath);
};

const saveGroups = () => saveDatabase(groupDatabaseFilePath, global.data.groups);
const saveUsers = () => saveDatabase(userDatabaseFilePath, global.data.users);

const addGroup = (chatId) => {
    const id = chatId.toString();
    if (!global.data.groups.has(id)) {
        global.data.groups.set(id, { ai: false, bot: true, meme: false, event: true, onlyadmin: false });
        saveGroups();
        return `Group ${chatId} added to the database.`;
    }
    return null;
};

const toggle = (chatId, setting, state) => {
    const id = chatId.toString();
    if (global.data.groups.has(id)) {
        const groupSettings = global.data.groups.get(id);
        if (setting in groupSettings) {
            groupSettings[setting] = state;
            saveGroups();
            return `${setting.charAt(0).toUpperCase() + setting.slice(1)} has been ${state ? 'enabled' : 'disabled'} for this group.`;
        }
        return `Invalid setting. Available settings are: ai, bot, meme, event, onlyadmin.`;
    }
    return `Group not found in the database.`;
};

const addUser = (userId) => {
    const id = userId.toString();
    if (!global.data.users.has(id)) {
        global.data.users.set(id, { exp: 0, level: 1, messageCount: 0 });
        saveUsers();
        return `User ${userId} added to the database.`;
    }
    return null;
};

const rankUp = (userId, fullName) => {
    const user = global.data.users.get(userId.toString());
    if (user) {
        user.messageCount++;
        const requiredMessages = 5 * Math.pow(2, user.level - 1);
        if (user.messageCount >= requiredMessages) {
            user.level++;
            user.exp += requiredMessages;
            user.messageCount = 0;
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