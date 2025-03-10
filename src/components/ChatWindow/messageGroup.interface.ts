import { Message } from "../../interfaces/message.interface";

export interface MessageGroup {
    date: string;
    messages: Message[];
    timestamp: number; 
}