import React, { useState } from 'react';
import {
  getGroqModel,
  setGroqModel,
  testGroqConnection,
  AVAILABLE_MODELS,
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

    setGroqModel(model);

    try {
      const result = await testGroqConnection();
      setTestResult({
        tested: true,
        ok: result.ok,
        latencyMs: result.latencyMs,
        error: result.error,
      });
    } catch (e: unknown) {
      setTestResult({
        tested: true,
        ok: false,
        error: e instanceof Error ? e.message : 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setGroqModel(model);
    onSaved?.();
    onClose();
  };

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
          <p className="notice">
            <Icon name="governance" size={16} />
            <span>
              The AI key is kept on the server and is never sent to your browser. Ask the system administrator if the
              connection test fails.
            </span>
          </p>

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
                    <span className="text-critical">Failed: {testResult.error || 'check the network'}</span>
                  )
                ) : (
                  'Checks the server can reach the AI service and measures the round trip.'
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
