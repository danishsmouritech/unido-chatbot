import { useEffect, useRef, useState } from "react";
import { askChatQuestion, createChatSession,getChatVisibility } from "../services/chatService";
import { getSocket } from "../services/socketService";
import { logger } from "../utils/logger";
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
          // Add a small delay to ensure session is persisted on backend
          return new Promise(resolve => setTimeout(() => resolve(createdSessionId), 100));
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
  const [error, setError] = useState("");
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const messagesRef = useRef(null);

  async function hydrateChatState() {
    try {
      const visibility = await getChatVisibility();

      if (!visibility.chatbotEnabled) {
        setChatbotEnabled(false);
        setIsOpen(false);
        return;
      }

      setChatbotEnabled(true);
      const resolvedSessionId = await getOrCreateSessionId();
      if (!resolvedSessionId) {
        throw new Error("Unable to initialize chat session");
      }
      setSessionId(resolvedSessionId);
    } catch {
      setChatbotEnabled(false);
      setIsOpen(false);
    }
  }

  useEffect(() => {
    hydrateChatState();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onVisibilityChanged = (payload) => {
      const enabled = Boolean(payload?.chatbotEnabled);
      setChatbotEnabled(enabled);
      if (!enabled) {
        setIsOpen(false);
        return;
      }
      hydrateChatState();
    };

    socket.on("chatbot:visibilityChanged", onVisibilityChanged);
    return () => {
      socket.off("chatbot:visibilityChanged", onVisibilityChanged);
    };
  }, []);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage(manualQuestion = null) {
      const raw = manualQuestion ?? input;
    const question = typeof raw === "string" ? raw.trim() : "";

  if (!question) {
    setError("Please enter a message");
    return;
  }

  setError("");
    if ( sending) return;

    if (!manualQuestion) {
      setInput("");
      setMessages((prev) => [...prev, { role: "user", text: question }]);
    }

    setSending(true);
    let currentSessionId = sessionId;

    try {
      if (!currentSessionId) {
        currentSessionId = await getOrCreateSessionId();
        if (!currentSessionId) {
          throw new Error("Unable to initialize chat session");
        }
        setSessionId(currentSessionId);
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const payload = await askChatQuestion({ sessionId: currentSessionId, question });
          setMessages((prev) => [...prev, { role: "bot", text: payload.answer || "No answer returned." }]);
          return;
        } catch (error) {
          logger.error("Chat error:", error);
          const message = error.message || "Failed to get response.";

          if (error.status === 404 || message.toLowerCase().includes("not found")) {
            logger.log("Session not found, refreshing...");
            sessionStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
            sessionInitPromise = null;

            const refreshedSessionId = await getOrCreateSessionId().catch(() => null);
            if (refreshedSessionId) {
              currentSessionId = refreshedSessionId;
              setSessionId(refreshedSessionId);
              continue; // retry once with a fresh session
            }
          }

          setMessages((prev) => [...prev, { role: "bot", text: message }]);
          return;
        }
      }

      setMessages((prev) => [...prev, { role: "bot", text: "Session was reset. Please try again." }]);
    } catch (error) {
      logger.error("Chat error:", error);
      const message = error.message || "Failed to get response.";
      setMessages((prev) => [...prev, { role: "bot", text: message }]);
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

          <div className="chat-panel-body chat-scroll" ref={messagesRef}>
            {messages.map((message, index) => (
              <div key={index} className={`chat-bubble ${message.role}`}>
                 {message.text}
              </div>
            ))}
          </div>

              {error && <div className="chat-error">{error}</div>}
          <div className="chat-panel-footer">
            <input
              className="chat-input"
              placeholder="Type your message..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                if (error) setError("");
              }
              }
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            />
            <button
              className="chat-send-btn"
              type="button"
              onClick={() => sendMessage()}
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
