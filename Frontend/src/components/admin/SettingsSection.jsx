export default function SettingsSection({
  settings,
  onSettingsChange,
  onSaveSettings
}) {
  const systemPrompt = settings?.systemPrompt || "";
  const maxPromptLength = 500;
  const isSystemPromptTooLong = systemPrompt.length > maxPromptLength;

  return (
    <div className="admin-panel-block row g-1">
      <div className="col-12 col-lg-12">
        <label className="form-label fs-4">System Prompt</label>
        <textarea
          className={`form-control ${isSystemPromptTooLong ? "is-invalid" : ""}`}
          rows="10"
          value={systemPrompt}
          onChange={(event) => {
            onSettingsChange((prev) => ({ ...prev, systemPrompt: event.target.value }));
          }}
        />
        <div className={`mt-1 small ${isSystemPromptTooLong ? "text-danger" : "text-muted"}`}>
          {systemPrompt.length}/{maxPromptLength} characters
        </div>
        {isSystemPromptTooLong ? (
          <div className="invalid-feedback d-block">
            System Prompt must be 500 characters or less.
          </div>
        ) : null}
      </div>

      <div className="col-12 col-lg-4 d-grid gap-3 align-content-start">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="chatbotEnabledSwitch"
            checked={settings?.chatbotEnabled || false}
            onChange={(event) =>
              onSettingsChange((prev) => ({ ...prev, chatbotEnabled: event.target.checked }))
            }
          />
          <label className="form-check-label" htmlFor="chatbotEnabledSwitch">
            Enable Chatbot
          </label>
        </div>
        <button
          className="btn btn-primary"
          onClick={onSaveSettings}
          disabled={isSystemPromptTooLong}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
