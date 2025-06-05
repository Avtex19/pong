Multiplayer Pong

A real-time multiplayer Pong game implemented with Node.js, Express, Socket.IO, and TypeScript. This project supports online matchmaking, live game updates, and handles player disconnections gracefully.

Features

Real-time multiplayer gameplay using WebSockets (Socket.IO)
Matchmaking queue for pairing players automatically
Player username validation and unique username enforcement
Server-side game logic for ball physics, scoring, and paddle collisions
Live game state updates sent 30 times per second (30 Hz)
Handles player disconnection and notifies the opponent
Single-page client interface served via Express