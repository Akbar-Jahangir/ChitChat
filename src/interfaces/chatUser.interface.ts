import { Message } from "./message.interface";

export interface ChatUserProps {
    userId: string;
    username: string;
    profilePicUrl: string;
    lastMessage?: Message | null; // Add this line
}
