const socketIo = require('socket.io');

let io;
const activeUsers = new Map(); // Map: userId -> Array of socketIds (handles multiple active tabs)

/**
 * Initializes the Socket.io server with CORS policies.
 * @param {object} server - Node.js HTTP server.
 * @returns {object} Socket.io server instance.
 */
const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Web Socket connected: ${socket.id}`);

    // Join room / Register User ID to Socket mapping
    socket.on('join', (userId) => {
      if (userId) {
        socket.userId = userId;
        
        if (!activeUsers.has(userId)) {
          activeUsers.set(userId, []);
        }
        
        // Add current socket connection to the user's socket array
        activeUsers.get(userId).push(socket.id);
        console.log(`👤 User registered to socket: ${userId} (Socket: ${socket.id})`);
        
        // Broadcast user status online
        io.emit('user_connected', { userId });
      }
    });

    // Song playing event (handles broadcasting friend activity in real-time)
    socket.on('song_playing', (data) => {
      // Expecting data: { userId, songId, title, artist, album, imageUrl }
      console.log(`🎵 User ${data.userId} started playing: "${data.title}" by ${data.artist}`);
      
      // Broadcast this song playing event to all other active listeners
      socket.broadcast.emit('friend_activity_update', data);
    });

    // Handle Disconnections
    socket.on('disconnect', () => {
      console.log(`🔌 Web Socket disconnected: ${socket.id}`);
      
      if (socket.userId && activeUsers.has(socket.userId)) {
        const userSockets = activeUsers.get(socket.userId);
        
        // Filter out this disconnected socket connection
        const updatedSockets = userSockets.filter((id) => id !== socket.id);
        
        if (updatedSockets.length > 0) {
          activeUsers.set(socket.userId, updatedSockets);
        } else {
          // If no remaining active sockets, user is fully offline
          activeUsers.delete(socket.userId);
          console.log(`👤 User went offline: ${socket.userId}`);
          
          // Broadcast user disconnected event
          io.emit('user_disconnected', { userId: socket.userId });
        }
      }
    });
  });

  return io;
};

/**
 * Returns the initialized Socket.io instance.
 * @returns {object} IO instance.
 */
const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized! Call initSocket first.');
  }
  return io;
};

/**
 * Emits a play count update to all active listeners in real-time.
 * @param {string} songId - The ID of the played song.
 * @param {number} totalPlays - The updated total plays count.
 */
const emitPlayCountUpdate = (songId, totalPlays) => {
  if (io) {
    io.emit('play_count_update', { songId, totalPlays });
  }
};

/**
 * Sends a real-time notification to a specific connected user.
 * @param {string} userId - Target user ID.
 * @param {object} notification - Notification payload (message, type, link, etc.)
 */
const emitNotification = (userId, notification) => {
  if (io && activeUsers.has(userId)) {
    const sockets = activeUsers.get(userId);
    sockets.forEach((socketId) => {
      io.to(socketId).emit('notification', notification);
    });
  }
};

module.exports = {
  initSocket,
  getIo,
  emitPlayCountUpdate,
  emitNotification,
  activeUsers,
};
