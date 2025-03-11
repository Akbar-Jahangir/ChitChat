import { RegisterUserProps } from './../interfaces/registerUser.interface';
import { SenderContext } from "./../contexts/ChatContext/ChatContext";
import { useContext, useState, useEffect } from "react";
import { ChatUserProps } from "../interfaces/chatUser.interface";
import { Message } from "../interfaces/message.interface";
import { db, query, where, getDocs } from "../utils/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { uid } from "uid";

const useDatabase = () => {
  const { setSendername, setSenderId, setSenderPicUrl } =
    useContext(SenderContext);
  const [storedUsers, setStoredUsers] = useState<ChatUserProps[]>([]);

  const saveMessage = async (message: Message): Promise<string> => {
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

  const signUp = async (userData: RegisterUserProps) => {
    try {
      const userRef = doc(db, "users", userData.email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return {
          success: false,
          message: "User already exists with this email.",
        };
      }

      // Store user data in Firestore
      await setDoc(doc(collection(db, "users"), userData.email), {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        profilePicUrl: userData.profilePicUrl,
        userId: uid(),
      });

      return { success: true, message: "Account created successfully!" };
    } catch (error) {
      console.error("Error in user registration:", error);
      return { success: false, message: "Unexpected error occurred." };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("Invalid email or password.");
        return;
      }

      const userData = querySnapshot.docs[0].data();

      // Check password manually
      if (userData.password !== password) {
        toast.error("Incorrect password. Please try again.");
        return;
      }

      // Ensure state updates before navigating
      setSenderId(userData.userId);
      setSendername(userData.username);
      setSenderPicUrl(userData.profilePicUrl);

      toast.success(`Logged in as ${userData.username}!`);
    } catch (err) {
      console.error("Error during login:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            username: data.username,
            profilePicUrl: data.profilePicUrl,
            email: data.email,
          } as ChatUserProps;
        });
        setStoredUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);


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
  
  const getAllMessages = async (): Promise<Message[]> => {
  try {
    const conversationsRef = collection(db, "conversations");

    const querySnapshot = await getDocs(conversationsRef);

    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const conversation = doc.data();
      if (conversation.messages) {
        messages.push(...conversation.messages);
      }
    });

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

const getUserById = async (userId: string) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userData = querySnapshot.docs[0].data();
    return {
      userId: userData.userId,
      username: userData.username,
      email: userData.email,
      profilePicUrl: userData.profilePicUrl,
      password:userData.password
    };
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};
const updateUserProfile = async (userData:RegisterUserProps) => {
  try {
    // First, get the user document reference
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("userId", "==", userData.userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, "users", userDoc.id);
    
    // Create updated data object
    const updatedData = {
      username: userData.username,
      profilePicUrl: userData.profilePicUrl,
      password:userData.password
    };
  
    if (userData.password) {
      updatedData.password = userData.password;
    }
    
    // Update the document
    await updateDoc(userRef, updatedData);
    
    // Update context state
    setSendername(userData.username);
    setSenderPicUrl(userData.profilePicUrl!);
    
    return { success: true, message: "Profile updated successfully!" };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, message: "Unexpected error occurred." };
  }
};

  return {
    login,
    signUp,
    storedUsers,
    saveMessage,
    getChatHistory,
    getAllMessages,
    updateUserProfile,
    getUserById
  };
};

export default useDatabase;
