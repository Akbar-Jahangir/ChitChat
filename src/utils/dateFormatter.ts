
export const formatChatListTimestamp = (timestamp: number): string => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    today.setDate(today.getDate());
  
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
  
    const isToday =
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear();
  
    const isYesterday =
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear();
  
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
  
    // Return month number instead of name: "MM/DD/YY" format
    return `${messageDate.getMonth() + 1}/${messageDate.getDate()}/${messageDate.getFullYear().toString().slice(2)}`;
  };
  
  export const formatMessageGroupDate = (timestamp: number): { display: string; timestamp: number } => {
    const messageDate = new Date(timestamp);
    const today = new Date();
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
      return { display: "", timestamp: midnightTimestamp }; // Empty string for today - no header will show
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
  