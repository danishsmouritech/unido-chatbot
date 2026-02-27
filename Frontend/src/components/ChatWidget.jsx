import { useEffect, useRef, useState } from "react";
import { askChatQuestion, createChatSession,getChatVisibility } from "../services/chatService";
import "../styles/chatWidget.css";

const INITIAL_MESSAGES = [{ role: "bot", text: "Hello. How can I help you?" }];
const CHAT_SESSION_STORAGE_KEY = "chatWidgetSessionId";
let sessionInitPromise = null;

async function getOrCreateSessionId() {
  const existingSessionId = sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  if (!sessionInitPromise) {
    sessionInitPromise = createChatSession()
      .then((payload) => {
        const createdSessionId = payload?.sessionId || null;
        if (createdSessionId) {
          sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, createdSessionId);
        }
        return createdSessionId;
      })
      .finally(() => {
        sessionInitPromise = null;
      });
  }

  return sessionInitPromise;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const messagesRef = useRef(null);

  useEffect(() => {
    async function initChat() {
      try {
        const visibility = await getChatVisibility();

        if (!visibility.chatbotEnabled) {
          setChatbotEnabled(false);
          return;
        }

        const resolvedSessionId = await getOrCreateSessionId();
        if (!resolvedSessionId) {
          throw new Error("Unable to initialize chat session");
        }
        setSessionId(resolvedSessionId);
      } catch {
        setChatbotEnabled(false);
      }
    }

    initChat();
  }, []);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !sessionId || sending) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setSending(true);

    try {
      const payload = await askChatQuestion({ sessionId, question });
      setMessages((prev) => [...prev, { role: "bot", text: payload.answer || "No answer returned." }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: error.message || "Failed to get response." }]);
    } finally {
      setSending(false);
    }
  }
  if (!chatbotEnabled) return null;
  return (
    <div className="chat-widget-root">
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span className="chat-panel-title">UNIDO Chatbot</span>
            <button
              className="chat-close-btn"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className="chat-panel-body hide-scrollbar  " ref={messagesRef}>
            {messages.map((message, index) => (
              <div key={index} className={`chat-bubble ${message.role}`}>
                 {message.text}
              </div>
            ))}
          </div>

          <div className="chat-panel-footer">
            <input
              className="chat-input"
              placeholder="Type your message..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            />
            <button
              className="chat-send-btn"
              type="button"
              onClick={sendMessage}
              disabled={sending}
            >
              {sending ? "..." : <i className="bi bi-send"></i>}
            </button>
          </div>
        </div>
      )}

      <button
        className="chat-launcher-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open chatbot"
      >
        <i className="bi bi-chat-dots-fill" />
      </button>
    </div>
  );
}
