const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const os = require('os');

function createServer() {
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server);

    // Serve static files from the 'public' directory
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    io.on('connection', (socket) => {
        socket.on('requestDashboardData', async () => {
            const data = await getDashboardData();
            socket.emit('dashboardUpdate', data);
        });

        socket.on('disconnect', () => {});
    });

    setInterval(async () => {
        const data = await getDashboardData();
        io.emit('dashboardUpdate', data);
    }, 1000);

    return { app, server, io };
}

// Utility to fetch dashboard data
async function getDashboardData() {
    const botInfo = getBotInfo();
    const ownerName = await getOwnerName(global.config.operator[0]);
    const uptimeString = formatUptime(process.uptime());
    const osInfo = getOsInfo();
    const ramUsage = getRamUsage();
    const ping = getPing();

    return {
        ...botInfo,
        botOwner: ownerName,
        uptime: uptimeString,
        os: osInfo,
        ramUsage: `${ramUsage}%`,
        ping: `${ping}`,
        serverTime: new Date().toLocaleString()
    };
}

// Utility to get bot info
function getBotInfo() {
    const botInfo = global.client.info;
    return {
        botName: botInfo.first_name,
        botId: botInfo.id,
        botUsername: botInfo.username,
        commandCount: global.client.commands.size,
        userCount: global.data.users.size,
        groupCount: global.data.groups.size
    };
}

// Utility to get owner's name
async function getOwnerName(ownerId) {
    const ownerInfo = await global.client.bot.getChat(ownerId);
    return ownerInfo.first_name + ' ' + (ownerInfo.last_name || '');
}

// Utility to format uptime
function formatUptime(uptime) {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Utility to get OS info
function getOsInfo() {
    return `${os.type()} ${os.release()}`;
}

// Utility to get RAM usage
function getRamUsage() {
    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    return ((usedMem / totalMem) * 100).toFixed(2);
}

// Utility to simulate ping
function getPing() {
    return Math.floor(Math.random() * 100) + 1;
}

async function startServer() {
    const { server } = createServer();
    const port = process.env.PORT || global.config.port || 3000;
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = { startServer };
