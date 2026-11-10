import React, { useState } from 'react';
import {
  getGroqApiKey,
  setGroqApiKey,
  getGroqModel,
  setGroqModel,
  testGroqConnection,
  AVAILABLE_MODELS,
  DEFAULT_GROQ_KEY,
} from '../services/groqService';
import { Icon } from './ui';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [apiKey, setApiKeyState] = useState(getGroqApiKey());
  const [model, setModelState] = useState(getGroqModel());
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    latencyMs?: number;
    error?: string;
  }>({ tested: false, ok: false });
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ tested: false, ok: false });

    // Temporarily apply input values for the test
    setGroqApiKey(apiKey);
    setGroqModel(model);

    try {
      const result = await testGroqConnection();
      setTestResult({
        tested: true,
        ok: result.ok,
        latencyMs: result.latencyMs,
        error: result.error,
      });
    } catch (e: any) {
      setTestResult({
        tested: true,
        ok: false,
        error: e.message || 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setGroqApiKey(apiKey);
    setGroqModel(model);
    onSaved?.();
    onClose();
  };

  const handleResetDefault = () => {
    setApiKeyState(DEFAULT_GROQ_KEY);
    setGroqApiKey(DEFAULT_GROQ_KEY);
  };

  const maskedKey = apiKey.length > 12 ? `${apiKey.slice(0, 7)}...${apiKey.slice(-5)}` : apiKey;

  return (
    <div className="overlay overlay-center" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <p className="eyebrow">Configuration</p>
            <h2 id="ai-settings-title">AI settings</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
            <Icon name="close" />
          </button>
        </header>

        <div className="modal-body">
          <div className="field">
            <label className="field-label" htmlFor="groq-key-input">
              Groq Cloud API key
            </label>
            <input
              id="groq-key-input"
              className="input mono"
              type="password"
              placeholder="gsk_..."
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
            />
            <p className="field-hint">
              <span>
                Active key <code>{maskedKey}</code>
              </span>
              <button type="button" className="link-btn" onClick={handleResetDefault}>
                Reset to default key
              </button>
            </p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="groq-model-select">
              Model
            </label>
            <select id="groq-model-select" className="input" value={model} onChange={(e) => setModelState(e.target.value)}>
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="test-box">
            <div>
              <p className="field-label">Connection test</p>
              <p className="field-hint" role="status">
                {testResult.tested ? (
                  testResult.ok ? (
                    <span className="text-ok">Connected. {testResult.latencyMs} ms round trip.</span>
                  ) : (
                    <span className="text-critical">Failed: {testResult.error || 'check the key and network'}</span>
                  )
                ) : (
                  'Checks the key and measures round-trip latency.'
                )}
              </p>
            </div>
            <button type="button" className="btn" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? 'Testing…' : 'Test connection'}
            </button>
          </div>

          <p className="notice">
            <Icon name="governance" size={16} />
            <span>
              Only aggregated epidemiological metrics are sent to the model. No identifiable patient data is processed,
              in line with Kenya's Data Protection Act (2019).
            </span>
          </p>
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save changes
          </button>
        </footer>
      </div>
    </div>
  );
};
