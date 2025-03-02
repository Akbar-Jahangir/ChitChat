import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Pusher from "pusher";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(bodyParser.json());

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

app.post("/send-message", async (req, res) => {
  const messageData = req.body;
  pusher
    .trigger("chat-channel", "new-message", messageData)
    .then(() => console.log("Pusher event triggered successfully"))
    .catch((error) => console.error("Pusher Error:", error));

  res.status(200).json({ message: "Message sent successfully!" });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
