const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const log = require('./log');
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
        // log.sys('A client connected');

        socket.on('requestDashboardData', async () => {
            try {
                const data = await fetchDashboardData();
                socket.emit('dashboardUpdate', data);
            } catch (error) {
                log.erro('Error fetching dashboard data:', error);
            }
        });

        socket.on('disconnect', () => {
            // log.sys('A client disconnected');
        });
    });

    async function fetchDashboardData() {
        // Fetch bot information
        const botInfo = global.client.info;
        const ownerId = global.config.operator[0];

        // Fetch owner's name
        const ownerInfo = await global.client.bot.getChat(ownerId);
        const ownerName = ownerInfo.first_name + ' ' + (ownerInfo.last_name || '');

        // Calculate uptime
        const uptime = process.uptime();
        const uptimeString = formatUptime(uptime);

        // Get OS info
        const osInfo = `${os.type()} ${os.release()}`;

        // Get RAM usage
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramUsage = ((usedMem / totalMem) * 100).toFixed(2);

        // Simulate ping (replace with actual ping measurement if available)
        const ping = Math.floor(Math.random() * 100) + 1;

        const data = {
            botName: botInfo.first_name,
            botId: botInfo.id,
            botUsername: botInfo.username,
            botOwner: ownerName,
            commandCount: global.client.commands.size,
            userCount: global.data.users.size,
            groupCount: global.data.groups.size,
            uptime: uptimeString,
            os: osInfo,
            ramUsage: `${ramUsage}%`,
            ping: `${ping}`,
            serverTime: new Date().toLocaleString()
        };
        return data;
    }

    function formatUptime(uptime) {
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    // Update all clients every second
    setInterval(async () => {
        try {
            const data = await fetchDashboardData();
            io.emit('dashboardUpdate', data);
        } catch (error) {
            log.erro('Error updating dashboard data:', error);
        }
    }, 1000);

    return { app, server, io };
}

async function startServer() {
    try {
        const { server } = createServer();

        // Use the PORT environment variable if available, otherwise use the config port or 3000 as fallback
        const port = process.env.PORT || global.config.port || 3000;
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }
}

module.exports = { startServer };
