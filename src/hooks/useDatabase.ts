import { SenderContext } from "./../contexts/ChatContext/ChatContext";
import { useContext, useState, useEffect } from "react";
import { signUpProps } from "../interfaces/signUp.interface";
import { ChatUserProps } from "../interfaces/chatUser.interface";
import { Message } from "../interfaces/message.interface";
import{ supabase} from "../utils/client";

const useDatabase = () => {
  const { setSendername, setSenderId, setSenderPicUrl } =
    useContext(SenderContext);
  const [storedUsers, setStoredUsers] = useState<ChatUserProps[]>([]);

  const saveMessage = async (message: Message): Promise<string> => {
    try {
      // Fetch conversations between the sender and recipient, considering both directions
      const { data: conversations, error: fetchError } = await supabase
        .from("conversations")
        .select("conversationId, messages")
        .or(`senderId.eq.${message.senderId},recipientId.eq.${message.recipientId}`)
        .or(`senderId.eq.${message.recipientId},recipientId.eq.${message.senderId}`)
        .limit(1);
  
      if (fetchError) {
        console.error("Error fetching conversation:", fetchError);
        throw new Error(`Failed to fetch conversation: ${fetchError.message}`);
      }
  
      let conversationId;
  
      if (conversations && conversations.length > 0) {
        // If the conversation exists, update the existing conversation with the new message
        conversationId = conversations[0].conversationId;
        const updatedMessages = [...(conversations[0].messages || []), message];
  
        console.log("Updating existing conversation with new message:", updatedMessages);
        const { error: updateError } = await supabase
        .from("conversations")
        .update({
          messages: supabase.rpc("array_append", { column: "messages", value: message }),
        })
        .eq("conversationId", conversationId);
      
        if (updateError) {
          console.error("Error updating conversation:", updateError);
          throw new Error(`Failed to update conversation: ${updateError.message}`);
        }
      } else {
        // If the conversation doesn't exist, create a new conversation
        console.log("Creating new conversation with the message:", message);
        const { data, error: insertError } = await supabase
          .from("conversations")
          .insert([
            {
              senderId: message.senderId,
              recipientId: message.recipientId,
              messages: [message],
            },
          ])
          .select("conversationId")
          .single();
  
        if (insertError) {
          console.error("Error inserting new conversation:", insertError);
          throw new Error(`Failed to create new conversation: ${insertError.message}`);
        }
        conversationId = data.conversationId;
      }
  
      console.log("Message saved successfully. Conversation ID:", conversationId);
      return message.messageId;
    } catch (error) {
      console.error("Error saving message:", error);
      throw new Error(`Failed to save message: ${error}`);
    }
  };
  

  const signUpUser = async (userData: signUpProps) => {
    try {
      // 1️⃣ Check if user already exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("email")
        .eq("email", userData.email)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error checking user:", fetchError);
        return { success: false, message: "Error checking user existence." };
      }

      if (existingUser) {
        return {
          success: false,
          message: "User already exists with this email.",
        };
      }

      // 2️⃣ If user does not exist, create a new one
      const { error: insertError } = await supabase
        .from("users")
        .insert([userData]);

      if (insertError) {
        console.error("Error creating user:", insertError);
        return { success: false, message: "Error creating user." };
      }

      return { success: true, message: "Account created successfully! 🎉" };
    } catch (err) {
      console.error("Error in user registration:", err);
      return { success: false, message: "Unexpected error occurred." };
    }
  };

  const loginUser = async (
    email: string,
    password: string,
    navigate: (path: string) => void
  ) => {
    try {
      // 1️⃣ Check if user exists in Supabase
      const { data: user, error } = await supabase
        .from("users")
        .select("userId, username, profilePicUrl, email, password")
        .eq("email", email)
        .single();

      if (error || !user) {
        alert("Invalid email or password.");
        return;
      }

      // 2️⃣ Verify Password
      if (user.password !== password) {
        alert("Incorrect password. Please try again.");
        return;
      }

      // 3️⃣ Store user session in local storage
      setSenderId(user.userId);
      setSendername(user.username);
      setSenderPicUrl(user.profilePicUrl);

      alert(`Logged as, ${user.username}! 🎉`);
      navigate("/chat"); // Redirect after successful login
    } catch (err) {
      console.error("Error during login:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: users, error } = await supabase.from("users").select();
      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setStoredUsers(users);
      }
    };
    fetchUsers();
  }, []);

  const getMessages = async (
    senderId: string,
    recipientId: string
  ): Promise<Message[]> => {
    try {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("messages")
        .or(`senderId.eq.${senderId},recipientId.eq.${senderId}`)
        .or(`senderId.eq.${recipientId},recipientId.eq.${recipientId}`)
        .limit(1);

      if (error) throw error;

      if (conversations && conversations.length > 0) {
        return conversations[0].messages || [];
      } else {
        return []; // No conversation found
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  return {
    loginUser,
    signUpUser,
    storedUsers,
    saveMessage,
    getMessages,
  };
};

export default useDatabase;
