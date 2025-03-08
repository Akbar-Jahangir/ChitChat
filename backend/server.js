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

// Add body parser middleware - THIS WAS MISSING
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});