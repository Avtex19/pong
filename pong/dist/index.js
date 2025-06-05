"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const Game_1 = __importDefault(require("./Game"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const HERTZ = 30;
const uNRegex = /^[a-zA-Z0-9_.-]{3,}$/;
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use(express_1.default.static(path_1.default.join(__dirname, '../node_modules')));
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// User class
class User {
    constructor(socket) {
        this.socket = socket;
        this.username = socket.id;
        this.game = { id: null, playing: false };
    }
}
const users = {};
let matchmaking = [];
const games = {};
// Manage socket connections
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    users[socket.id] = new User(socket);
    io.emit('player-broadcast', Object.keys(users).length);
    socket.on('set-username', (username, callback) => {
        let sameUsername = false;
        if (!uNRegex.test(username)) {
            callback(false);
            sameUsername = true;
        }
        for (const key in users) {
            if (users[key].username === username) {
                callback(false);
                sameUsername = true;
            }
        }
        if (!sameUsername && users[socket.id].username === socket.id) {
            console.log(`${socket.id} set username to ${username}`);
            users[socket.id].username = username;
            callback(true);
            socket.emit('matchmaking-begin');
            matchMaker(socket.id);
        }
        else {
            console.log(`Username '${username}' is invalid or already in use`);
        }
    });
    socket.on('get-ping', (callback) => {
        callback(true);
    });
    socket.on('disconnect', () => {
        var _a, _b, _c;
        console.log(`Client disconnected: ${(_a = users[socket.id]) === null || _a === void 0 ? void 0 : _a.username}`);
        delete users[socket.id];
        io.emit('player-broadcast', Object.keys(users).length);
        if (matchmaking.length !== 0 && matchmaking[0] === socket.id) {
            matchmaking = [];
        }
        for (const key in games) {
            const game = games[key];
            if (game.player1 === socket.id) {
                (_b = users[game.player2]) === null || _b === void 0 ? void 0 : _b.socket.emit('player-left');
                delete games[key];
            }
            else if (game.player2 === socket.id) {
                (_c = users[game.player1]) === null || _c === void 0 ? void 0 : _c.socket.emit('player-left');
                delete games[key];
            }
        }
    });
});
function matchMaker(newPlayer) {
    if (matchmaking.length !== 0) {
        const p1 = matchmaking[0];
        const p2 = newPlayer;
        const game = new Game_1.default(p1, users[p1].username, p2, users[p2].username);
        games[game.id] = game;
        users[p1].game = { id: game.id, playing: true };
        users[p2].game = { id: game.id, playing: true };
        users[p1].socket.emit('game-started', {
            username: users[p1].username,
            player: 1,
            opp_username: users[p2].username,
            ball: game.ball
        });
        users[p2].socket.emit('game-started', {
            username: users[p2].username,
            player: 2,
            opp_username: users[p1].username
        });
        console.log(`Game ${game.id} has started.`);
        matchmaking = [];
    }
    else {
        matchmaking.push(newPlayer);
    }
}
// Game state update loop
setInterval(() => {
    var _a, _b;
    for (const key in games) {
        const game = games[key];
        game.update();
        const data = {
            1: {
                score: game.players[game.player1].score,
                pos: game.players[game.player1].pos
            },
            2: {
                score: game.players[game.player2].score,
                pos: game.players[game.player2].pos
            },
            ball: game.ball
        };
        (_a = users[game.player1]) === null || _a === void 0 ? void 0 : _a.socket.emit('game-data', {
            score: data[1].score,
            opp_score: data[2].score,
            opp_pos: data[2].pos,
            ball: data.ball
        }, (newPos) => {
            game.players[game.player1].pos = newPos;
        });
        (_b = users[game.player2]) === null || _b === void 0 ? void 0 : _b.socket.emit('game-data', {
            score: data[2].score,
            opp_score: data[1].score,
            opp_pos: data[1].pos,
            ball: data.ball
        }, (newPos) => {
            game.players[game.player2].pos = newPos;
        });
    }
}, 1000 / HERTZ);
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
