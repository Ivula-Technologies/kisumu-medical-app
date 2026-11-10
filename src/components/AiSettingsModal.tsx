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
    <div className="ai-modal-backdrop" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <header className="ai-modal-header">
          <div>
            <span className="eyebrow" style={{ color: '#8fe8eb' }}>Configuration & Diagnostics</span>
            <h3>Groq Cloud AI Settings</h3>
          </div>
          <button type="button" className="ai-drawer-close" onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </header>

        <div className="ai-modal-body">
          <div className="ai-form-group">
            <label htmlFor="groq-key-input">Groq Cloud API Key</label>
            <input
              id="groq-key-input"
              type="password"
              placeholder="gsk_..."
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
            />
            <small style={{ color: '#557b85', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Current active key: <code>{maskedKey}</code></span>
              <button
                type="button"
                className="text-button"
                style={{ fontSize: '0.75rem', color: '#0d6f7a', cursor: 'pointer' }}
                onClick={handleResetDefault}
              >
                Reset to Provided Key
              </button>
            </small>
          </div>

          <div className="ai-form-group">
            <label htmlFor="groq-model-select">Active LLM Model</label>
            <select
              id="groq-model-select"
              value={model}
              onChange={(e) => setModelState(e.target.value)}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#557b85' }}>
              Optimized for Kenya public health decision support and low-latency inference.
            </small>
          </div>

          <div className="ai-status-box">
            <div>
              <strong>Connection Test:</strong>
              <div style={{ fontSize: '0.8rem', color: '#4a6875', marginTop: '3px' }}>
                {testResult.tested ? (
                  testResult.ok ? (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      ✓ Online • {testResult.latencyMs}ms latency via Groq Cloud
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>
                      ✕ Failed: {testResult.error || 'Check key and network'}
                    </span>
                  )
                ) : (
                  'Click Test to verify connection and measure round-trip latency'
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-ai btn-ai-outline"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div style={{ padding: '12px', background: '#f5f9f9', borderRadius: '10px', fontSize: '0.78rem', color: '#385d66', lineHeight: 1.5 }}>
            🛡️ <strong>Data Governance & Privacy:</strong> Kisumu Health Intelligence only transmits aggregated epidemiological metrics. Under Kenya’s Data Protection Act (2019), no identifiable individual patient data is processed by the LLM.
          </div>
        </div>

        <footer className="ai-modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-ai" onClick={handleSave}>
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};
