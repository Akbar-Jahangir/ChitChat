import { Message } from "../../../interfaces/message.interface";
import { MessageGroup } from "../messageGroup.interface";
import { db, query, where, getDocs } from "../../../utils/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

// Format the date for message groups
export const formatMessageGroupDate = (timestamp: number): { display: string; timestamp: number } => {
    const messageDate = new Date(timestamp);
    const today = new Date()
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset hours to compare just the dates
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    // We'll use the timestamp at midnight of each day for sorting
    const midnightTimestamp = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
    ).getTime();

    if (messageDay.getTime() === todayDay.getTime()) {
        return { display: "", timestamp: midnightTimestamp };
    } else if (messageDay.getTime() === yesterdayDay.getTime()) {
        return { display: "Yesterday", timestamp: midnightTimestamp };
    } else {
        // Format as "3/7/2025" instead of "March 7, 2025"
        return {
            display: messageDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            }),
            timestamp: midnightTimestamp
        };
    }
};

// Group messages by date for display
export function groupMessagesByDate(messages: Message[]): MessageGroup[] {
    const groups: Record<string, { messages: Message[], timestamp: number }> = {};

    messages.forEach(message => {
        const { display, timestamp } = formatMessageGroupDate(message.timestamp);
        if (!groups[display]) {
            groups[display] = { messages: [], timestamp };
        }
        groups[display].messages.push(message);
    });

    return Object.entries(groups)
        .map(([date, { messages, timestamp }]) => ({
            date,
            messages: messages.sort((a, b) => a.timestamp - b.timestamp),
            timestamp
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
}

// Get channel name from user IDs
export function getChannelName(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `chat-${sortedIds[0]}-${sortedIds[1]}`;
}

// Check if a URL is a data URL
export function isDataUrl(url: string): boolean {
    return url.startsWith('data:');
}

// Convert data URL to Blob
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
}

// Create a File from a Blob
export function blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { type: blob.type });
}
export const saveMessage = async (message: Message): Promise<string> => {
    try {
      console.log("Saving new message:", message);

      // Generate a unique conversation ID (sorted sender-recipient)
      const conversationId =
        message.senderId < message.recipientId
          ? `${message.senderId}_${message.recipientId}`
          : `${message.recipientId}_${message.senderId}`;

      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("participants", "array-contains", message.senderId)
      );
      const querySnapshot = await getDocs(q);

      let conversationDocId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(message.recipientId)) {
          conversationDocId = doc.id;
        }
      });

      if (!conversationDocId) {
        // Create a new conversation
        const newConversationRef = await addDoc(conversationsRef, {
          conversationId,
          participants: [message.senderId, message.recipientId],
          messages: [message],
        });

        conversationDocId = newConversationRef.id;
      } else {
        // Update the existing conversation by adding a new message
        const conversationRef = doc(db, "conversations", conversationDocId);
        await updateDoc(conversationRef, {
          messages: arrayUnion(message),
        });
      }

      console.log(
        "Message saved successfully to conversation:",
        conversationDocId
      );
      return message.messageId;
    } catch (error) {
      console.error("Error saving message:", error);
      throw new Error(`Failed to save message: ${error}`);
    }
  };