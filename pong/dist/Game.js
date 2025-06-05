"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const MAX_SPEED = 5;
const MIN_SPEED = 2;
const MAX_SCORE = 10;
class Game {
    constructor(id1, username1, id2, username2) {
        this.id = (0, uuid_1.v4)();
        this.player1 = id1;
        this.player2 = id2;
        this.players = {
            [id1]: { name: username1.toString(), pos: 50, score: 0 },
            [id2]: { name: username2.toString(), pos: 50, score: 0 },
        };
        this.ball = [20, 50];
        this.ball_velocity = [MIN_SPEED, 0];
    }
    update() {
        this.ball[0] += this.ball_velocity[0];
        this.ball[1] += this.ball_velocity[1];
        // Scoring
        if (this.ball[0] >= 100) {
            this.players[this.player1].score++;
            this.reset(1);
        }
        else if (this.ball[0] <= 0) {
            this.players[this.player2].score++;
            this.reset(2);
        }
        // Wall bounce
        if (this.ball[1] >= 100) {
            this.ball_velocity[1] *= -1;
            this.ball[1] = 99;
        }
        else if (this.ball[1] <= 0) {
            this.ball_velocity[1] *= -1;
            this.ball[1] = 1;
        }
        // Paddle collision - player2 (right)
        if (this.ball[1] < this.players[this.player2].pos + 10 &&
            this.ball[1] + 2 > this.players[this.player2].pos - 10 &&
            this.ball[0] > 94 &&
            this.ball[0] < 98) {
            this.ball[0] = 94;
            const relativeIntersectY = this.players[this.player2].pos - this.ball[1] - 1;
            const normalizedY = relativeIntersectY / 10;
            this.ball_velocity[0] = -((1 - Math.abs(normalizedY)) * (MAX_SPEED - MIN_SPEED) +
                MIN_SPEED);
            this.ball_velocity[1] = -normalizedY;
        }
        // Paddle collision - player1 (left)
        else if (this.ball[1] < this.players[this.player1].pos + 10 &&
            this.ball[1] + 2 > this.players[this.player1].pos - 10 &&
            this.ball[0] < 6 &&
            this.ball[0] > 2) {
            this.ball[0] = 6;
            const relativeIntersectY = this.players[this.player1].pos - this.ball[1] - 1;
            const normalizedY = relativeIntersectY / 10;
            this.ball_velocity[0] =
                (1 - Math.abs(normalizedY)) * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
            this.ball_velocity[1] = -normalizedY;
        }
    }
    reset(player) {
        if (player === 1) {
            this.ball = [60, 50];
            this.ball_velocity = [-(MIN_SPEED - 1), 0];
        }
        else {
            this.ball = [40, 50];
            this.ball_velocity = [MIN_SPEED - 1, 0];
        }
    }
}
exports.default = Game;
