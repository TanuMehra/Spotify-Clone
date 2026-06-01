# 🎵 Enterprise Spotify Clone Backend API (v2.0)

This is a complete, production-ready, enterprise-grade Node.js + Express.js + MongoDB backend built on a robust MVC (Model-View-Controller) architecture. 

It is fully fortified with **Helmet security headers**, **IP rate limiters**, **Express-Validator input validation rules**, and cookie-based **Access & Refresh Token rotation**. It features **Socket.io integration** to handle real-time playback updates, global play metrics tracking, and instant in-app alerts.

---

## 🚀 Elevated Enterprise Features

1.  **Dual Token Authentication Rotation**: 
    *   **Short-Lived Access Tokens (15m)** are issued via secure HTTP-Only cookies to secure transactional requests.
    *   **Long-Lived Refresh Tokens (7d)** are stored securely in the database and a secure cookie, allowing silent automatic access-token renewal.
2.  **Websockets (Socket.io)**: Fully bidirectional state updates:
    *   Dynamic tracking of online/offline status.
    *   Real-time playing updates (Friend Activity feeds).
    *   Global play counts increment broadcast triggers.
    *   Targeted user notifications.
3.  **Comprehensive Security Shield**:
    *   **Helmet**: Protects standard HTTP headers from clickjacking, sniffing, and vulnerabilities.
    *   **IP Rate Limiting**: Throttles potential Denial-of-Service (DoS) and brute-force attempts at 150 requests per 15 minutes.
    *   **Express Validator**: Rigorous type and presence checks on emails, passwords, usernames, and music assets.
4.  **SMTP Password Recovery**: Secure password reset crypto-token flows using `Nodemailer`, with console log fallbacks for fluid development testing.
5.  **Multi-Dimensional MVC Schema**:
    *   `User`: Tracks role profiles (`user`, `artist`, `admin`), liked arrays, recent plays (strictly capped at 20 tracks), and mutual follows of `Artist` profiles.
    *   `Artist`: Handles statistical track metrics (monthly listeners, follower list references, bio contents).
    *   `Album`: Groups tracks releases with release date stamps.
    *   `Song`: Coordinates play talleys, likes counts, and storage keys.
    *   `Playlist`: Visibility controls (`isPublic`).

---

## 📁 Project Structure

```text
backend/
│
├── src/
│   ├── config/
│   │   ├── db.js             # Mongoose connection logic
│   │   ├── cloudinary.js     # Cloudinary stream helper integration
│   │   └── socket.js         # Socket.io connection mapping and events
│   │
│   ├── controllers/
│   │   ├── authController.js     # Rotation tokens, login, logout, resets
│   │   ├── userController.js     # User actions, likes, follows, history
│   │   ├── songController.js     # Track uploads, search, play increment
│   │   ├── playlistController.js # Playlist CRUD operations
│   │   ├── albumController.js    # Album creation, listings, deletion
│   │   ├── artistController.js   # Artist profiles and cascade deletion
│   │   └── adminController.js    # System-wide metrics dashboard
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js     # Access Token JWT validation
│   │   ├── adminMiddleware.js    # Role guards (isAdmin, isArtistOrAdmin)
│   │   ├── uploadMiddleware.js   # Multer file parsing limits
│   │   └── errorMiddleware.js    # Standardized ApiError mapping
│   │
│   ├── models/
│   │   ├── User.js           # User schema (roles, followings, history)
│   │   ├── Song.js           # Song schema (play count, likes count, refs)
│   │   ├── Playlist.js       # Playlist schema (isPublic toggle)
│   │   ├── Album.js          # Album schema (songs list, covers)
│   │   └── Artist.js         # Artist schema (monthly listeners, followers)
│   │
│   ├── routes/
│   │   ├── authRoutes.js     # Auth routing (validators active)
│   │   ├── userRoutes.js     # Likes and follows routing
│   │   ├── songRoutes.js     # Track and search routing
│   │   ├── playlistRoutes.js # Playlist routing
│   │   ├── albumRoutes.js    # Album routing
│   │   ├── artistRoutes.js   # Artist routing
│   │   └── adminRoutes.js    # Admin metrics routing
│   │
│   ├── utils/
│   │   ├── generateAccessToken.js   # Access Token factory (15m)
│   │   ├── generateRefreshToken.js  # Refresh Token factory + Cookie (7d)
│   │   └── ApiError.js              # Standardized API Error template
│   │
│   ├── app.js                # Express app setup, rate-limit, helmet
│   └── server.js             # HTTP server wrapper, sockets mount, db
│
├── .env                      # Local parameters config (gitignored)
├── .env.example              # Variables blueprint
├── package.json              # Script configurations
└── README.md                 # Technical Operational Guide
```

---

## ⚡ Setup & Launch Instructions

### 1. Download Packages
Execute inside the `backend/` folder:
```bash
npm install
```

### 2. Configure Settings
Duplicate the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill in the parameters:
*   `MONGODB_URI`: Atlas Database connection URI string.
*   `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Two distinct secret strings.
*   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Free Cloudinary credentials.
*   `EMAIL_USER` & `EMAIL_PASS`: SMTP credentials (e.g. Mailtrap) for forgot password emails.

### 3. Launch Development Server
```bash
npm run dev
```

---

## 🔌 Socket.io Websocket API Integration

To bind your React frontend, connect using the `socket.io-client` library pointing to `http://localhost:5000`.

### Client Events to Emit
1.  **Register User** (send immediately upon connection or user login):
    ```javascript
    socket.emit('join', userId);
    ```
2.  **Broadcast Play Activity** (send whenever a user clicks "Play"):
    ```javascript
    socket.emit('song_playing', {
      userId: "user_id_here",
      songId: "song_id_here",
      title: "Bohemian Rhapsody",
      artist: "Queen",
      imageUrl: "cover_url_here"
    });
    ```

### Server Events to Listen to (Client Hookups)
1.  **Friend Activity Feed**:
    ```javascript
    socket.on('friend_activity_update', (data) => {
      // Returns playing object: { userId, songId, title, artist, imageUrl }
      console.log(`${data.artist} is playing on a friend's device!`, data);
    });
    ```
2.  **Real-Time Play Counts**:
    ```javascript
    socket.on('play_count_update', (data) => {
      // Returns: { songId, totalPlays }
      updateSongPlayUI(data.songId, data.totalPlays);
    });
    ```
3.  **Dynamic Notifications**:
    ```javascript
    socket.on('notification', (notif) => {
      // Returns: { type: 'NEW_FOLLOWER'/'SONG_LIKED', message: "..." }
      displayToast(notif.message);
    });
    ```
4.  **Online / Offline Events**:
    *   `user_connected`: Returns `{ userId }`
    *   `user_disconnected`: Returns `{ userId }`

---

## 🔗 Complete REST API Route Reference

| Module | Method | Endpoint | Access | Body Payload Rules (JSON/FormData) |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH** | **POST** | `/api/auth/register` | Public | `{ fullName, username, email, password }` |
| | **POST** | `/api/auth/login` | Public | `{ email, password }` |
| | **POST** | `/api/auth/refresh-token` | Public | `{ refreshToken }` *(Also checks HTTP cookies)* |
| | **POST** | `/api/auth/logout` | Private | *None* (Revokes DB Token and wipes cookies) |
| | **POST** | `/api/auth/forgot-password` | Public | `{ email }` (Creates cryptotoken and sends mail) |
| | **POST** | `/api/auth/reset-password` | Public | `{ token, password }` (Verifies token, resets pass) |
| | **PUT** | `/api/auth/change-password` | Private | `{ currentPassword, newPassword }` |
| **USER** | **GET** | `/api/users/me` | Private | *None* (Retrieves detailed User profile) |
| | **POST** | `/api/users/like/:songId` | Private | *None* (Likes song, increments likes counter) |
| | **DELETE**| `/api/users/unlike/:songId` | Private | *None* (Unlikes song, decrements likes counter) |
| | **GET** | `/api/users/liked` | Private | *None* (Populated catalog of liked songs) |
| | **POST** | `/api/users/recent/:songId` | Private | *None* (Prepend to play history, limits history to 20) |
| | **GET** | `/api/users/recent` | Private | *None* (Gets play history tracks) |
| | **POST** | `/api/users/follow/:artistId` | Private | *None* (User follows artist, updates numbers) |
| | **DELETE**| `/api/users/unfollow/:artistId` | Private | *None* (User unfollows artist) |
| **SONGS** | **POST** | `/api/songs` | Artist/Admin| **FormData**: `title`, `artistId`, `duration`, files: `audio`, `image` |
| | **GET** | `/api/songs` | Private | *None* (Lists tracks) |
| | **GET** | `/api/songs/search` | Private | Query parameter `?q=searchterm` (Matches track/artist/genre) |
| | **GET** | `/api/songs/:id` | Private | *None* (Populated single track detail) |
| | **POST** | `/api/songs/:id/play` | Private | *None* (Increments play tallies and emits Socket alert) |
| | **DELETE**| `/api/songs/:id` | Artist/Admin| *None* (Cascade deletes files, tracks, and entries) |
| **ALBUMS**| **POST** | `/api/albums` | Artist/Admin| **FormData**: `title`, `artistId`, file: `image` (coverImage) |
| | **GET** | `/api/albums` | Private | *None* (Lists albums) |
| | **GET** | `/api/albums/:id` | Private | *None* (Retrieves album with songs) |
| | **DELETE**| `/api/albums/:id` | Artist/Admin| *None* (Cascade deletes covers and sets song refs to null) |
| **ARTIST**| **POST** | `/api/artists` | Admin | **FormData**: `name`, `bio`, `socialLinks`, file: `image` |
| | **GET** | `/api/artists` | Private | *None* (Lists artists) |
| | **GET** | `/api/artists/:id` | Private | *None* (Retrieves artist detailed stats, albums, and tracks) |
| | **DELETE**| `/api/artists/:id` | Admin | *None* (Wipes profile, albums, songs, files, and links) |
| **PLAYLIST**|**POST** | `/api/playlists` | Private | **FormData**: `name`, `description`, `isPublic`, file: `image` |
| | **GET** | `/api/playlists` | Private | *None* (Retrieves owned playlists) |
| | **POST** | `/api/playlists/:id/song` | Private | `{ songId }` (Adds song to playlist) |
| | **DELETE**| `/api/playlists/:id/song/:songId` | Private | *None* (Removes song from playlist) |
| | **DELETE**| `/api/playlists/:id` | Private | *None* (Wipes playlist) |
| **ADMIN** | **GET** | `/api/admin/dashboard` | Admin | *None* (Returns total analytical counts and popular plays) |
