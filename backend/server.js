import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Pusher from "pusher";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "https://chit-chat-pink.vercel.app"
}));

// Add body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Health check endpoint
app.get("/health-check", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Send message endpoint
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

// Pusher authentication endpoint for presence channels
app.post("/pusher/auth", (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const userId = req.body.user_id;

  console.log("Auth request for:", { socketId, channel, userId });

  // Authenticate presence channels
  if (channel.startsWith('presence-')) {
    const presenceData = {
      user_id: userId,
      user_info: {
        name: userId
      }
    };

    try {
      const auth = pusher.authorizeChannel(socketId, channel, presenceData);
      console.log("Auth successful for presence channel");
      res.send(auth);
    } catch (error) {
      console.error("Presence auth error:", error);
      res.status(500).json({ error: "Failed to authenticate" });
    }
  } else {
    // For non-presence channels
    console.log("Auth not required for regular channel");
    res.status(200).json({ success: true });
  }
});

// User status update endpoint
app.post("/user-status", async (req, res) => {
  const { userId, status } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Trigger an event to all clients about user status change
    await pusher.trigger("user-status", "status-change", {
      userId,
      status: status || "online"
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});