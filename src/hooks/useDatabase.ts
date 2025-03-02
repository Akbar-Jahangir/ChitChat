import { SenderContext } from "./../contexts/ChatContext/ChatContext";
import { useContext, useState, useEffect } from "react";
import { signUpProps } from "../interfaces/signUp.interface";
import { ChatUserProps } from "../interfaces/chatUser.interface";
import { Message } from "../interfaces/message.interface";

const useDatabase = () => {
  const { setSendername, setSenderId, setSenderPicUrl } =
    useContext(SenderContext);
  const [storedUsers, setStoredUsers] = useState<ChatUserProps[]>([]);

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open("chatApp", 1);

      openRequest.onupgradeneeded = () => {
        const db = openRequest.result;

        if (!db.objectStoreNames.contains("users")) {
          const store = db.createObjectStore("users", { keyPath: "userId" });
          store.createIndex("userId", "userId", { unique: true });
          store.createIndex("email", "email", { unique: true });
        }

        if (!db.objectStoreNames.contains("conversations")) {
          const conversationStore = db.createObjectStore("conversations", {
            keyPath: "conversationId",
          });
          conversationStore.createIndex("senderId", "senderId", {
            unique: false,
          });
          conversationStore.createIndex("recipientId", "recipientId", {
            unique: false,
          });
          conversationStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }
      };

      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject("Failed to open IndexedDB");
    });
  };

  const saveMessage = async (message: Message): Promise<string> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("conversations", "readwrite");
      const store = transaction.objectStore("conversations");
      let conversationFound = false;
      store.openCursor().onsuccess = async (event) => {
        const cursor = (event.target as IDBRequest)
          .result as IDBCursorWithValue;

        if (cursor) {
          const storedConversation = cursor.value;

          if (
            (storedConversation.senderId === message.senderId &&
              storedConversation.recipientId === message.recipientId) ||
            (storedConversation.senderId === message.recipientId &&
              storedConversation.recipientId === message.senderId)
          ) {
            conversationFound = true;
            message.conversationId = storedConversation.conversationId;
            storedConversation.messages = storedConversation.messages || [];
            storedConversation.messages.push(message);
            cursor.update(storedConversation);
            resolve(message.messageId);
            return;
          }
          cursor.continue();
        } else {
          if (!conversationFound) {
            const conversationId = message.conversationId;
            const newConversation = {
              conversationId,
              senderId: message.senderId,
              recipientId: message.recipientId,
              timestamp: Date.now(),
              messages: [message],
            };
            store.add(newConversation);
            resolve(message.messageId);
          }
        }
      };
      store.openCursor().onerror = () => reject("Error fetching conversations");
    });
  };

  const signUpUser = async (userData: signUpProps) => {
    try {
      const db = await openDB();
      const transaction = db.transaction("users", "readwrite");
      const store = transaction.objectStore("users");
      const emailIndex = store.index("email");

      const emailCheckRequest = emailIndex.get(userData.email);
      emailCheckRequest.onsuccess = async () => {
        if (emailCheckRequest.result) {
          alert("User already exists! Please login.");
        } else {
          const request = store.put(userData);
          request.onsuccess = async () => {
            alert("You have successfully registered! Welcome aboard.");
            await getAllUsers();
          };
          request.onerror = () => console.error("Error adding user");
        }
      };

      emailCheckRequest.onerror = () =>
        console.log("Error checking email existence");
    } catch (error) {
      console.error(error);
    }
  };

  const loginUser = async (
    email: string,
    password: string,
    navigate: (path: string) => void
  ) => {
    try {
      const db = await openDB();
      const transaction = db.transaction("users", "readonly");
      const store = transaction.objectStore("users");
      const emailIndex = store.index("email");

      const emailCheckRequest = emailIndex.get(email);
      emailCheckRequest.onsuccess = async () => {
        const userRecord = emailCheckRequest.result;

        if (userRecord && userRecord.password === password) {
          setSendername(userRecord.username);
          setSenderId(userRecord.userId);
          setSenderPicUrl(userRecord.profilePicUrl);
          navigate("/Chat");
          alert("Login successful!");
          await getAllUsers();
        } else {
          alert("Invalid email or password.");
        }
      };

      emailCheckRequest.onerror = () =>
        console.log("Error checking email existence");
    } catch (error) {
      console.error(error);
    }
  };

  const getAllUsers = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction("users", "readonly");
      const store = transaction.objectStore("users");

      return new Promise<signUpProps[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const users = request.result;
          setStoredUsers(users);
          resolve(users);
        };
        request.onerror = () => reject("Error fetching all users");
      });
    } catch (error) {
      console.error(error);
      return [];
    }
  };
  const getMessages = async (): Promise<Message[]> => {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open("chatApp", 1);

      openRequest.onsuccess = () => {
        const db = openRequest.result;
        const transaction = db.transaction("conversations", "readonly");
        const store = transaction.objectStore("conversations");
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };

      openRequest.onerror = () => reject(openRequest.error);
    });
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  return {
    loginUser,
    signUpUser,
    storedUsers,
    saveMessage,
    getMessages,
    getAllUsers,
  };
};

export default useDatabase;
