import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import Game from "./Game";


const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server);

const HERTZ = 30;
const uNRegex = /^[a-zA-Z0-9_.-]{3,}$/;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../node_modules')));
app.get('/', (req: Request, res: Response) => {
	res.sendFile(path.join(__dirname, '../public/index.html'));
});

class User {
	socket: Socket;
	username: string;
	game: { id: string | null; playing: boolean };

	constructor(socket: Socket) {
		this.socket = socket;
		this.username = socket.id;
		this.game = { id: null, playing: false };
	}
}

interface Users {
	[id: string]: User;
}

interface Games {
	[id: string]: InstanceType<typeof Game>;
}

const users: Users = {};
let matchmaking: string[] = [];
const games: Games = {};

io.on('connection', (socket: Socket) => {
	console.log(`New client connected: ${socket.id}`);
	users[socket.id] = new User(socket);

	io.emit('player-broadcast', Object.keys(users).length);

	socket.on('set-username', (username: string, callback: (success: boolean) => void) => {
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
		} else {
			console.log(`Username '${username}' is invalid or already in use`);
		}
	});

	socket.on('get-ping', (callback: (pong: boolean) => void) => {
		callback(true);
	});

	socket.on('disconnect', () => {
		console.log(`Client disconnected: ${users[socket.id]?.username}`);
		delete users[socket.id];
		io.emit('player-broadcast', Object.keys(users).length);

		if (matchmaking.length !== 0 && matchmaking[0] === socket.id) {
			matchmaking = [];
		}

		for (const key in games) {
			const game = games[key];
			if (game.player1 === socket.id) {
				users[game.player2]?.socket.emit('player-left');
				delete games[key];
			} else if (game.player2 === socket.id) {
				users[game.player1]?.socket.emit('player-left');
				delete games[key];
			}
		}
	});
});

function matchMaker(newPlayer: string): void {
	if (matchmaking.length !== 0) {
		const p1 = matchmaking[0];
		const p2 = newPlayer;

		const game = new Game(p1, users[p1].username, p2, users[p2].username);
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
	} else {
		matchmaking.push(newPlayer);
	}
}

setInterval(() => {
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

		users[game.player1]?.socket.emit('game-data', {
			score: data[1].score,
			opp_score: data[2].score,
			opp_pos: data[2].pos,
			ball: data.ball
		}, (newPos: number) => {
			game.players[game.player1].pos = newPos;
		});

		users[game.player2]?.socket.emit('game-data', {
			score: data[2].score,
			opp_score: data[1].score,
			opp_pos: data[1].pos,
			ball: data.ball
		}, (newPos: number) => {
			game.players[game.player2].pos = newPos;
		});
	}
}, 1000 / HERTZ);

server.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
