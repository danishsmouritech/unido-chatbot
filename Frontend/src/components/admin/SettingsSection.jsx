import { useState, useEffect } from "react";

export default function SettingsSection({
  settings,
  onSettingsChange,
  onSaveSettings
}) {
  const [rows, setRows] = useState(10);
  useEffect(() => {
    const handleResize = () => {
      setRows(window.innerWidth <= 991 ? 8 : 10);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const systemPrompt = settings?.systemPrompt || "";
  const maxPromptLength = 500;
  const isSystemPromptTooLong = systemPrompt.length > maxPromptLength;
  const charPercent = Math.min((systemPrompt.length / maxPromptLength) * 100, 100);

  return (
    <div className="settings-section">
      <div className="section-header">
        <div className="section-icon" style={{ background: "#f0f4ff", color: "#0066b3" }}>
          <i className="bi bi-sliders2" />
        </div>
        <div>
          <h3 className="section-title">System Configuration</h3>
          <p className="section-subtitle">Manage chatbot behavior and system prompt</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-prompt-area">
          <label className="settings-label">
            <i className="bi bi-chat-square-text" />
            System Prompt
          </label>
          <textarea
            className={`settings-textarea ${isSystemPromptTooLong ? "has-error" : ""}`}
            rows={rows}
            value={systemPrompt}
            placeholder="Define how the chatbot should behave..."
            onChange={(event) => {
              onSettingsChange((prev) => ({ ...prev, systemPrompt: event.target.value }));
            }}
          />
          <div className="char-counter-bar">
            <div className="char-counter-fill" style={{
              width: `${charPercent}%`,
              background: isSystemPromptTooLong ? "#dc3545" : charPercent > 80 ? "#d97706" : "#0066b3"
            }} />
          </div>
          <div className={`char-counter-text ${isSystemPromptTooLong ? "text-danger" : ""}`}>
            {systemPrompt.length} / {maxPromptLength} characters
          </div>
        </div>

        <div className="settings-controls">
          <div className="toggle-card">
            <div className="toggle-card-content">
              <div className={`toggle-status-dot ${settings?.chatbotEnabled ? "active" : ""}`} />
              <div>
                <strong>Chatbot Status</strong>
                <p>{settings?.chatbotEnabled ? "Chatbot is active and responding to users" : "Chatbot is disabled for all users"}</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings?.chatbotEnabled || false}
                onChange={(event) =>
                  onSettingsChange((prev) => ({ ...prev, chatbotEnabled: event.target.checked }))
                }
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <button
            className="settings-save-btn"
            onClick={onSaveSettings}
            disabled={isSystemPromptTooLong}
          >
            <i className="bi bi-check2-circle" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
