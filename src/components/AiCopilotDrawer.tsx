import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askHealthCopilot, type ChatMessage, getGroqModel } from '../services/groqService';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  contextSummary: string;
  onOpenSettings: () => void;
}

const DEFAULT_QUESTIONS: Record<string, string[]> = {
  Overview: [
    'Summarise Kisumu County public health highlights this week',
    'Which sub-counties have the highest alert intensity and why?',
    'What key risks should be highlighted to the County Health Executive?',
  ],
  'Disease Signals': [
    'Explain the Nyakach malaria spike and recommended response',
    'What IDSR active case-finding actions should CHPs take?',
    'Draft a clinical triage advisory for suspected cholera/diarrhoea',
  ],
  'Commodity Forecast': [
    'Which facilities face immediate AL and ORS stockout risk?',
    'Provide an inter-facility redistribution plan for Nyando',
    'What buffer stock should be requested from KEMSA urgently?',
  ],
  'Data Quality': [
    'Which facilities are non-reporting and what is the escalation procedure?',
    'How do eCHIS, KenyaEMR and KHIS completeness metrics compare?',
    'Identify validation failures requiring HRO field visits',
  ],
  'Pilot M&E': [
    'Analyse alert verification time progress against baseline',
    'Evaluate forecast accuracy (MAPE) trends across sub-counties',
    'Strategies to boost weekly active users in Seme and Muhoroni?',
  ],
  'Data & Governance': [
    'Review compliance with Kenya Data Protection Act 2019',
    'Explain the AI provenance and human confirmation safeguards',
    'What critical gaps are identified in the governance register?',
  ],
};

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h4 style={{ margin: '10px 0 4px', color: '#0b2b3a', fontSize: '1rem' }}>{children}</h4>,
        h2: ({ children }) => <h5 style={{ margin: '10px 0 4px', color: '#0b4952', fontSize: '0.95rem' }}>{children}</h5>,
        h3: ({ children }) => <h6 style={{ margin: '8px 0 4px', color: '#0d6f7a', fontSize: '0.88rem', fontWeight: 700 }}>{children}</h6>,
        h4: ({ children }) => <strong style={{ display: 'block', margin: '6px 0 2px', color: '#17363f' }}>{children}</strong>,
        p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: 1.6 }}>{children}</p>,
        strong: ({ children }) => <strong style={{ color: '#0b2b3a', fontWeight: 700 }}>{children}</strong>,
        em: ({ children }) => <em style={{ color: '#4a6875' }}>{children}</em>,
        ul: ({ children }) => <ul style={{ margin: '6px 0', paddingLeft: '18px', lineHeight: 1.6 }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: '6px 0', paddingLeft: '18px', lineHeight: 1.6 }}>{children}</ol>,
        li: ({ children }) => <li style={{ margin: '3px 0' }}>{children}</li>,
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          return isBlock ? (
            <pre style={{ background: '#f0f7f7', borderRadius: '8px', padding: '10px 14px', overflowX: 'auto', fontSize: '0.8rem', margin: '8px 0' }}>
              <code>{children}</code>
            </pre>
          ) : (
            <code style={{ background: 'rgba(13,111,122,0.1)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.82rem', color: '#0b4952' }}>{children}</code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: '3px solid #0d6f7a', margin: '8px 0', paddingLeft: '12px', color: '#4a6875', fontStyle: 'italic' }}>
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '8px 0' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' }}>{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th style={{ background: '#0b2b3a', color: '#ecf7f8', padding: '6px 10px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700 }}>{children}</th>
        ),
        td: ({ children }) => (
          <td style={{ padding: '5px 10px', borderBottom: '1px solid #e0eded', verticalAlign: 'top' }}>{children}</td>
        ),
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(13,111,122,0.15)', margin: '12px 0' }} />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#0d6f7a', textDecoration: 'underline' }}>{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  contextSummary,
  onOpenSettings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `**Jambo! 👋 Kisumu Health Intelligence AI Copilot**

I am your decision-support assistant for the **County Department of Health, Kisumu County, Kenya**, powered by Groq Cloud.

I have visibility across **7 sub-counties**, **261 facilities**, and can help with:

- 🦟 **Disease surveillance** — epidemiological signals, IDSR protocols
- 💊 **Supply chain** — commodity forecasts, KEMSA redistribution
- 📊 **Data quality** — reporting gaps, validation failures
- 📋 **Governance** — Kenya Data Protection Act compliance

> *All AI insights require human verification before action.*

How can I support your public health decision-making today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const currentQuestions = DEFAULT_QUESTIONS[activeTab] || DEFAULT_QUESTIONS['Overview'];

  const handleSend = async (userText?: string) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askHealthCopilot(
        textToSend,
        { activeTab, details: contextSummary },
        messages
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error contacting Groq Cloud AI**\n\n${err.message || 'Unable to complete request.'}\n\nPlease check your API key in **Settings**.`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `**New conversation started.** How can I help with ${activeTab}?`,
    }]);
  };

  return (
    <div className="ai-drawer-overlay" onClick={onClose}>
      <aside className="ai-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="ai-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-crest" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
              AI
            </div>
            <div>
              <span className="eyebrow" style={{ color: '#94a3b8', fontSize: '0.65rem' }}>IDSR Surveillance Intelligence</span>
              <h3>Clinical Decision Support</h3>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={clearChat}
              title="Clear chat"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #334155', color: '#cbd5e1', cursor: 'pointer', borderRadius: '4px', padding: '5px 8px', fontSize: '0.74rem' }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #334155', color: '#cbd5e1', cursor: 'pointer', borderRadius: '4px', padding: '5px 8px', fontSize: '0.74rem' }}
            >
              Model Config
            </button>
            <button type="button" className="ai-drawer-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </header>

        {/* Context bar */}
        <div className="ai-context-indicator">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600 }}>Active View:</span>
            <strong>{activeTab}</strong>
            <span style={{ color: '#94a3b8' }}>• Kisumu County IDSR</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="status-badge-dot" style={{ background: '#10b981' }} />
            <small style={{ color: '#0f766e', fontWeight: 700, fontSize: '0.72rem' }}>
              {getGroqModel().includes('/') ? getGroqModel().split('/')[1] : getGroqModel()}
            </small>
          </span>
        </div>

        {/* Chat body */}
        <div className="ai-chat-body">
          {messages.map((msg, index) => (
            <div key={index} className={`ai-message ${msg.role}`}>
              <div className="ai-message-header">
                <span className="status-badge-dot" style={{ background: msg.role === 'assistant' ? '#0d9488' : '#64748b' }} />
                <span className="ai-message-sender">
                  {msg.role === 'assistant' ? 'Clinical Decision Support' : 'Epidemiologist / Officer'}
                </span>
              </div>
              <div className="ai-message-bubble">
                {msg.role === 'assistant' ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-message assistant">
              <div className="ai-message-header">
                <span className="status-badge-dot" style={{ background: '#0d9488' }} />
                <span className="ai-message-sender">Clinical Decision Support</span>
              </div>
              <div className="ai-message-bubble ai-thinking-bubble">
                <span style={{ color: '#475569', fontSize: '0.82rem' }}>
                  Querying Groq Cloud inference engine...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="quick-prompts-container">
          <span className="quick-prompts-label">RECOMMENDED CLINICAL QUERIES — {activeTab.toUpperCase()}</span>
          <div className="quick-prompts-scroll">
            {currentQuestions.map((q) => (
              <button
                key={q}
                type="button"
                className="quick-prompt-chip"
                onClick={() => handleSend(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <footer className="ai-chat-footer">
          <textarea
            ref={inputRef}
            className="ai-chat-input"
            placeholder={`Ask about ${activeTab} data... (Enter to send, Shift+Enter for new line)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={2}
          />
          <button
            type="button"
            className="ai-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            title="Send message"
          >
            {isLoading ? (
              <div className="typing-dots" style={{ display: 'flex', gap: '3px', padding: '0 4px' }}>
                <span style={{ width: '5px', height: '5px', background: '#fff', borderRadius: '50%', animation: 'typingDot 1.2s infinite 0s' }} />
                <span style={{ width: '5px', height: '5px', background: '#fff', borderRadius: '50%', animation: 'typingDot 1.2s infinite 0.2s' }} />
                <span style={{ width: '5px', height: '5px', background: '#fff', borderRadius: '50%', animation: 'typingDot 1.2s infinite 0.4s' }} />
              </div>
            ) : 'Send'}
          </button>
        </footer>
      </aside>
    </div>
  );
};
