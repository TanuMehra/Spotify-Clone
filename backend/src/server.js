// 1. Initial Load of environment variables
require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

// Capture Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION TRIGGERED! Server closing...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// 2. Establish Database Connection
connectDB();

// 3. Create HTTP Server
const server = http.createServer(app);

// 4. Mount Socket.io Server channels
initSocket(server);

// Define running port
const PORT = process.env.PORT || 5000;

// 5. Fire up Server Listener
const activeServer = server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎵 Enterprise Spotify Clone Backend running in [${process.env.NODE_ENV}]`);
  console.log(`⚡ WebSocket Server and HTTP paths bound successfully`);
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🔗 Endpoint entry: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

// Capture Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION TRIGGERED! Shutting down server gracefully...');
  console.error(err.name, err.message);
  
  activeServer.close(() => {
    process.exit(1);
  });
});
