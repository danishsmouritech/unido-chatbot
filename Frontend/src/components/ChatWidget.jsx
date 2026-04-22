import { useEffect, useRef, useState } from "react";
import { askChatQuestion, createChatSession, getChatVisibility } from "../services/chatService";
import { getSocket } from "../services/socketService";
import { logger } from "../utils/logger";
import "../styles/chatWidget.css";

const INITIAL_MESSAGES = [
  {
    role: "bot",
    text: "Welcome to UNIDO Careers! I can help you find job opportunities, understand eligibility, and guide you through the application process. What would you like to know?"
  }
];
const QUICK_ACTIONS = [
  "What jobs are available?",
  "How do I apply?",
  "What are the benefits?"
];
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
          return new Promise((resolve) => setTimeout(() => resolve(createdSessionId), 100));
        }
        return createdSessionId;
      })
      .finally(() => {
        sessionInitPromise = null;
      });
  }

  return sessionInitPromise;
}

function TypingIndicator() {
  return (
    <div className="chat-bubble bot typing-indicator">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );
}

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

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
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, sending]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  async function sendMessage(manualQuestion = null) {
    const raw = manualQuestion ?? input;
    const question = typeof raw === "string" ? raw.trim() : "";

    if (!question) {
      setError("Please enter a message");
      return;
    }

    setError("");
    if (sending) return;

    if (!manualQuestion) {
      setInput("");
    }

    setShowQuickActions(false);
    setMessages((prev) => [...prev, { role: "user", text: question, time: new Date() }]);
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
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: payload.answer || "No answer returned.", time: new Date() }
          ]);
          return;
        } catch (err) {
          logger.error("Chat error:", err);
          const message = err.message || "Failed to get response.";

          if (err.status === 404 || message.toLowerCase().includes("not found")) {
            logger.log("Session not found, refreshing...");
            sessionStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
            sessionInitPromise = null;

            const refreshedSessionId = await getOrCreateSessionId().catch(() => null);
            if (refreshedSessionId) {
              currentSessionId = refreshedSessionId;
              setSessionId(refreshedSessionId);
              continue;
            }
          }

          setMessages((prev) => [...prev, { role: "bot", text: message, time: new Date() }]);
          return;
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Session was reset. Please try again.", time: new Date() }
      ]);
    } catch (err) {
      logger.error("Chat error:", err);
      const message = err.message || "Failed to get response.";
      setMessages((prev) => [...prev, { role: "bot", text: message, time: new Date() }]);
    } finally {
      setSending(false);
    }
  }

  if (!chatbotEnabled) return null;

  return (
    <div className="chat-widget-root">
      {isOpen && (
        <div className="chat-panel" role="dialog" aria-label="UNIDO Careers Chat">
          <div className="chat-panel-header">
            <div className="chat-header-left">
              <div className="chat-avatar">
                <i className="bi bi-robot" />
              </div>
              <div className="chat-header-info">
                <span className="chat-panel-title">UNIDO Careers</span>
                <span className="chat-status-badge">
                  <span className="status-dot" />
                  Online
                </span>
              </div>
            </div>
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
              <div key={index} className={`chat-msg-row ${message.role}`}>
                {message.role === "bot" && (
                  <div className="chat-msg-avatar">
                    <i className="bi bi-robot" />
                  </div>
                )}
                <div className="chat-msg-content">
                  <div className={`chat-bubble ${message.role}`}>{message.text}</div>
                  {message.time && (
                    <span className="chat-timestamp">{formatTimestamp(message.time)}</span>
                  )}
                </div>
              </div>
            ))}

            {sending && <TypingIndicator />}

            {showQuickActions && messages.length <= 1 && (
              <div className="chat-quick-actions">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    className="quick-action-btn"
                    type="button"
                    onClick={() => sendMessage(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <div className="chat-error">{error}</div>}

          <div className="chat-panel-footer">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about UNIDO careers..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (error) setError("");
              }}
              onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && sendMessage()}
              disabled={sending}
              maxLength={500}
            />
            <button
              className="chat-send-btn"
              type="button"
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              {sending ? (
                <span className="send-spinner" />
              ) : (
                <i className="bi bi-send-fill" />
              )}
            </button>
          </div>

          <div className="chat-panel-branding">
            Powered by UNIDO AI
          </div>
        </div>
      )}

      <button
        className={`chat-launcher-btn ${isOpen ? "active" : ""}`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? <i className="bi bi-x-lg" /> : <i className="bi bi-chat-dots-fill" />}
        {!isOpen && <span className="launcher-pulse" />}
      </button>
    </div>
  );
}
