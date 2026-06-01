# 🎵 Spotify Clone (MERN Stack)

Welcome to the **Spotify Clone** project! This repository has been structured as a professional, enterprise-grade MERN (MongoDB, Express, React, Node) stack application. The codebase is organized into independent sub-projects for clean separation of concerns, easy scalability, and modular development.

---

## 📂 Project Architecture

```text
spotify-clone/
├── frontend/                 # Frontend React + Vite Application
│   ├── src/                  # React components, hooks, assets, and context
│   ├── public/               # Static assets (favicons, svgs, etc.)
│   ├── index.html            # Single-page application entry HTML
│   ├── vite.config.js        # Vite bundler configurations
│   ├── tailwind.config.js    # Tailwind CSS layout configs
│   └── package.json          # Frontend dependencies & local npm scripts
│
├── backend/                  # Backend Node.js + Express Server API
│   ├── src/                  # Controllers, models, routes, middlewares
│   │   ├── controllers/      # Route controllers (songs, users, etc.)
│   │   ├── models/           # MongoDB schemas & mongoose models
│   │   ├── routes/           # Express routes mapping controllers
│   │   ├── middleware/       # Authentication, security, error-handling middleware
│   │   └── server.js         # API Server main entry point
│   ├── .env.example          # Environment variables template
│   └── package.json          # Backend dependencies & local npm scripts
│
├── package.json              # Workspace root control (runs/builds frontend & backend)
└── README.md                 # Project workspace documentation (this file)
```

---

## 🛠️ Tech Stack

*   **Frontend**: React (v19), Vite, Tailwind CSS, React Router, Context API
*   **Backend**: Node.js, Express.js, Socket.io, Cloudinary (Media upload), JWT authentication
*   **Database**: MongoDB (Mongoose ODM)

---

## 🚀 Getting Started

You can control, install, and run both applications directly from the root workspace directory using standard `npm` workspace-level scripts.

### 1. Installation

To install all dependencies for both the frontend and backend in one command, run:

```bash
npm run install:all
```

Alternatively, you can install them independently:

*   **Frontend only**: `npm run install:frontend`
*   **Backend only**: `npm run install:backend`

### 2. Environment Configuration

The backend requires some environment variables to operate (database URI, API keys, etc.).
1.  Navigate into the `backend/` directory.
2.  Copy `.env.example` to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
3.  Open `.env` and fill in your actual credentials (MongoDB connection string, Cloudinary API keys, etc.).

### 3. Running the Application

You can run the frontend and backend dev environments independently from the root folder:

*   **Run Frontend (React + Vite)**:
    ```bash
    npm run frontend
    ```
    This launches the Vite dev server at [http://localhost:5173](http://localhost:5173).

*   **Run Backend (Express server with Nodemon)**:
    ```bash
    npm run backend
    ```
    This launches the Express API server with live reloading at [http://localhost:5000](http://localhost:5000).

*   **Build Frontend**:
    ```bash
    npm run build:frontend
    ```
    This compiles the production-ready frontend bundle into `frontend/dist`.

---

## 🔒 Security & Best Practices

The **backend** is equipped with modern, production-ready security layers:
*   **Helmet**: Protects against common web vulnerabilities by setting HTTP headers correctly.
*   **Express Rate Limit**: Rate limiting to prevent brute-force attacks and abuse.
*   **JWT & HTTP-Only Cookies**: Secure auth tokens stored securely in cookies to prevent XSS-based theft.
*   **CORS Configuration**: Safe cross-origin requests routing configured for client connection.
