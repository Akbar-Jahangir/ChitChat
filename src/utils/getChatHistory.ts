import { Message } from "../interfaces/message.interface";
import { db, query, where, getDocs } from "../utils/firebaseConfig";
import { collection } from "firebase/firestore";

const getChatHistory = async (
  senderId: string,
  recipientId: string
): Promise<Message[]> => {
  try {
    const conversationsRef = collection(db, "conversations");

    // Query messages where senderId and recipientId match either way
    const q = query(
      conversationsRef,
      where("participants", "array-contains", senderId)
    );

    const querySnapshot = await getDocs(q);

    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const conversation = doc.data();
      if (
        conversation.participants.includes(recipientId) &&
        conversation.messages
      ) {
        messages.push(...conversation.messages);
      }
    });

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};
export default getChatHistory;
