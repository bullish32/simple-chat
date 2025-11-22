const path = require('path');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from /public (our frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Track connected clients
const clients = new Set();

// Store recent messages in memory (so new users see history)
const messages = []; // we'll keep the last 50 messages

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total:', clients.size);

  // 🔹 b) When someone connects, send them the existing chat history
  messages.forEach((msg) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  });

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      console.error('Invalid message received:', data.toString());
      return;
    }

    // Make sure there is a timestamp
    msg.time = msg.time || new Date().toISOString();

    // Save message in history (keep only last 50)
    messages.push(msg);
    if (messages.length > 50) {
      messages.shift(); // remove oldest
    }

    const payload = JSON.stringify(msg);

    // Broadcast this message to all connected clients
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total:', clients.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});
