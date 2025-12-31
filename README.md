# 💕 WhatsApp-Style Private Chat Application

Full-stack private chat application with React frontend and Node.js backend, perfect for couples to communicate privately.

## Features

- ✨ Real-time messaging using Socket.io
- 💾 Message persistence with MongoDB
- 💕 Beautiful, modern UI design
- 🔒 Private chat between users
- ⌨️ Typing indicators
- 📱 Responsive design (mobile-friendly)
- 📜 Chat history - messages are saved and loaded automatically
- 🖼️ Image and audio message support
- 😊 Emoji reactions
- 🚂 Ready for Railway deployment

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS
- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Database**: MongoDB Atlas
- **Deployment**: Railway

## Local Development

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm run install-all
```

2. Start the application:

**Option A: Using batch files (Easiest - Windows)**
```cmd
# Terminal 1 - Start backend
start-server.bat

# Terminal 2 - Start frontend  
start-client.bat
```

**Option B: Using npm scripts**
```bash
# Terminal 1 - Start backend
cd server
npm start

# Terminal 2 - Start frontend
cd client
npm start
```

**Option C: Using root npm scripts (Recommended)**
```bash
# Install all dependencies first
npm run install-all

# Start both frontend and backend together
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser (dev mode) or [http://localhost:5000](http://localhost:5000) (production mode)

## Docker Build

### Build the Docker image:
```bash
docker build -t private-chat-app .
```

### Run the container locally:
```bash
docker run -p 5000:5000 private-chat-app
```

The app will be available at [http://localhost:5000](http://localhost:5000)

### Run with Docker Compose (with persistent database):
```bash
docker-compose up -d
```

This will persist the database file in a Docker volume, so your messages won't be lost when the container restarts.

## 🚂 Railway Deployment

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Full stack app ready for Railway"
git remote add origin https://github.com/Veerendra-Uppara/whatsapp_new.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose `whatsapp_new` repository
6. Railway will auto-detect and deploy!

### Step 3: Environment Variables (Optional)

In Railway dashboard → Variables, you can add:
- `PORT` (usually auto-set by Railway)
- `NODE_ENV=production`

**Note:** Since frontend and backend are on the same server, no `REACT_APP_SOCKET_URL` is needed! The app automatically uses `window.location.origin` for the socket connection.

### Step 4: Get Your URL

After deployment, Railway provides a URL like:
`https://your-app.railway.app`

Your app will be live at this URL! 🎉

### How It Works

Railway automatically:
1. Installs all dependencies (`npm run install-all`)
2. Builds React app (`npm run build`)
3. Starts Node.js server (`npm start`)
4. Serves both frontend and backend from the same server

The Express server serves the built React app from `client/build`, so everything runs on a single URL.

## Environment Variables

### Local Development

- `PORT`: Server port (default: 5000)
- `REACT_APP_SOCKET_URL`: Socket.io server URL for frontend (default: http://localhost:5000)

### Railway Deployment

- `PORT`: Auto-set by Railway (usually dynamic)
- `NODE_ENV`: Set to `production` (optional)

**Note:** For Railway, the app automatically detects it's running on the same server and uses `window.location.origin` for socket connections. No additional environment variables needed!

## Usage

1. Enter your name and a unique ID
2. Share the application URL with your partner
3. Start chatting!

## Message Storage

Messages are stored in a SQLite database file (`server/chat.db`). This means:
- ✅ All messages are persisted and survive server restarts
- ✅ Chat history is automatically loaded when users join
- ✅ No additional database service required (perfect for Oracle Cloud)
- ✅ Database file is created automatically on first run

**Note**: For production deployments, consider:
- Using a persistent volume for the database file (in Docker/Kubernetes)
- Regular database backups
- For Oracle Cloud, you can use Object Storage or attach a block volume for the database file

## Security Notes

- This is a basic private chat application
- For production use, consider adding:
  - Authentication/Authorization
  - Message encryption
  - User session management
  - Rate limiting
  - HTTPS/SSL certificates
  - Database encryption for stored messages

## License

ISC

