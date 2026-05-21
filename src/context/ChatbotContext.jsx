import { createContext, useCallback, useContext, useState } from "react";

const ChatbotContext = createContext(null);

export function ChatbotProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openChatbot = useCallback(() => setOpen(true), []);
  const closeChatbot = useCallback(() => setOpen(false), []);

  return (
    <ChatbotContext.Provider value={{ open, openChatbot, closeChatbot }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used within <ChatbotProvider />");
  return ctx;
}
