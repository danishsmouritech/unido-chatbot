export default function SettingsSection({
  settings,
  onSettingsChange,
  onSaveSettings
}) {
  return (
    <div className="admin-panel-block row g-3">
      <div className="col-12 col-lg-8">
        <label className="form-label">System Prompt</label>
        <textarea
          className="form-control"
          rows="10"
          value={settings?.systemPrompt || ""}
          onChange={(event) =>
            onSettingsChange((prev) => ({ ...prev, systemPrompt: event.target.value }))
          }
        />
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
        <button className="btn btn-primary" onClick={onSaveSettings}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
