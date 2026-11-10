import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askHealthCopilot, type ChatMessage, getGroqModel } from '../services/groqService';
import { Icon } from './ui';

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
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="table-wrap">
              <table>{children}</table>
            </div>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
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
      content: `**Jambo.** I am the decision-support assistant for the County Department of Health, Kisumu.

I can see aggregated data for **7 sub-counties** and **261 facilities**, and can help with:

- **Disease surveillance**: epidemiological signals and IDSR protocols
- **Supply chain**: commodity forecasts and KEMSA redistribution
- **Data quality**: reporting gaps and validation failures
- **Governance**: Kenya Data Protection Act controls

> All AI insights require human verification before action.

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
          content: `**Could not reach Groq Cloud AI**\n\n${err.message || 'Unable to complete request.'}\n\nPlease check your API key in **Settings**.`,
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

  const modelLabel = getGroqModel().includes('/') ? getGroqModel().split('/')[1] : getGroqModel();

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label="AI copilot">
        <header className="drawer-head">
          <div>
            <p className="eyebrow">Decision support · {activeTab}</p>
            <h2>Health copilot</h2>
          </div>
          <div className="drawer-tools">
            <button type="button" className="btn btn-sm btn-quiet" onClick={clearChat}>
              Clear
            </button>
            <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label="AI settings" title="AI settings">
              <Icon name="settings" />
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close copilot">
              <Icon name="close" />
            </button>
          </div>
        </header>

        <p className="drawer-context">
          <span className="dot dot-ok" aria-hidden="true" />
          <span className="mono">{modelLabel}</span>
          <span>Aggregated data only. Verify before acting.</span>
        </p>

        <div className="chat">
          {messages.map((msg, index) => (
            <div key={index} className={`msg msg-${msg.role}`}>
              <p className="msg-from">{msg.role === 'assistant' ? 'Copilot' : 'You'}</p>
              <div className="msg-body">
                {msg.role === 'assistant' ? <MarkdownMessage content={msg.content} /> : msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="msg msg-assistant">
              <p className="msg-from">Copilot</p>
              <div className="msg-body msg-thinking">
                <span className="typing" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                Working on it…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="prompts">
          <p className="eyebrow">Suggested for {activeTab}</p>
          {currentQuestions.map((q) => (
            <button key={q} type="button" className="prompt" onClick={() => handleSend(q)} disabled={isLoading}>
              {q}
            </button>
          ))}
        </div>

        <footer className="composer">
          <label className="sr-only" htmlFor="copilot-input">
            Message the copilot
          </label>
          <textarea
            id="copilot-input"
            ref={inputRef}
            className="input"
            placeholder={`Ask about ${activeTab}. Enter to send, Shift+Enter for a new line.`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={2}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Icon name="send" size={16} />
            Send
          </button>
        </footer>
      </aside>
    </div>
  );
};
