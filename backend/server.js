import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Pusher from "pusher";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: function(origin, callback) {
    
    const allowedOrigins = [
      process.env.CLIENT_URL || "https://chit-chat-pink.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173"  
    ];
    
   
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const onlineUsers = new Set();


app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


app.get("/health-check", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.get("/", (req, res) => {
  res.send("Server is running!");
});


app.post("/send-message", async (req, res) => {
  console.log("Received message data:", req.body);

  const { messageData, channel } = req.body;

  if (!messageData || !channel) {
    return res.status(400).json({ error: "Invalid data received" });
  }

  try {
    await pusher.trigger(channel, "new-message", messageData);
    console.log("Pusher event triggered successfully");
    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Pusher Error:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});


app.post("/pusher/auth", (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const userId = req.body.user_id;

  console.log("Auth request for:", { socketId, channel, userId });

  if (!socketId || !channel) {
    return res.status(400).json({ error: "Missing socket_id or channel_name" });
  }

  // Authenticate presence channels
  if (channel.startsWith('presence-')) {
    const presenceData = {
      user_id: userId || 'anonymous', // Fallback for missing user_id
      user_info: {
        name: userId || 'anonymous'
      }
    };

    try {
      const auth = pusher.authorizeChannel(socketId, channel, presenceData);
      console.log("Auth successful for presence channel");
      res.send(auth);
    } catch (error) {
      console.error("Presence auth error:", error);
      res.status(500).json({ error: "Failed to authenticate", details: error.message });
    }
  } else {
    // For non-presence channels, just authorize the connection
    try {
      const auth = pusher.authorizeChannel(socketId, channel);
      console.log("Auth successful for regular channel");
      res.send(auth);
    } catch (error) {
      console.error("Regular auth error:", error);
      res.status(500).json({ error: "Failed to authenticate", details: error.message });
    }
  }
});

// User joining presence channel
app.post("/join-presence", async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Add user to our in-memory store
    onlineUsers.add(userId);
    
    // Trigger an event to the shared presence channel about the new user
    await pusher.trigger("presence-users", "user-online", {
      id: userId,
      info: { name: userId }
    });
    
    console.log(`User ${userId} is now online. Total online users: ${onlineUsers.size}`);
    res.status(200).json({ 
      success: true,
      onlineCount: onlineUsers.size,
      onlineUsers: Array.from(onlineUsers)
    });
  } catch (error) {
    console.error("Join presence error:", error);
    res.status(500).json({ error: "Failed to update presence status", details: error.message });
  }
});

// User leaving presence channel
app.post("/leave-presence", async (req, res) => {
  // Support both JSON and URL-encoded form data (for sendBeacon)
  const userId = req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Remove user from our in-memory store
    onlineUsers.delete(userId);
    
    // Trigger an event to the shared presence channel about the user leaving
    await pusher.trigger("presence-users", "user-offline", {
      id: userId
    });
    
    console.log(`User ${userId} is now offline. Total online users: ${onlineUsers.size}`);
    res.status(200).json({ 
      success: true,
      onlineCount: onlineUsers.size,
      onlineUsers: Array.from(onlineUsers)
    });
  } catch (error) {
    console.error("Leave presence error:", error);
    res.status(500).json({ error: "Failed to update presence status", details: error.message });
  }
});

// Get all online users
app.get("/online-users", (req, res) => {
  res.status(200).json({
    onlineCount: onlineUsers.size,
    onlineUsers: Array.from(onlineUsers)
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});