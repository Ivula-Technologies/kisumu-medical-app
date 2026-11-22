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
    'Where is the referral pathway losing the most people, and why might that be?',
    'Which settlements should the coordinator follow up this week?',
    'What would raise the share of referrals seen within the timeframe?',
  ],
  Escalations: [
    'What should a CHP do while waiting for the on-call clinician?',
    'How should an escalation be followed up after handover?',
    'What makes an escalation protocol safe in a low-connectivity setting?',
  ],
  'New referral': [
    'How should a CHP explain a positive screening result without stigma?',
    'What does a positive PHQ-9 item 9 require under mhGAP?',
    'When should alcohol use be referred before depression?',
  ],
  Referrals: [
    'What should good feedback to a CHP include after a referral is seen?',
    'How should a facility decide whether to decline a referral?',
    'What should be checked when a referral has no consent recorded?',
  ],
  'Follow-up': [
    'How should a CHP trace someone who missed a mental health appointment?',
    'How can reminders be sent without disclosing someone’s mental health status?',
    'What are common reasons people miss mental health referrals in informal settlements?',
  ],
  Directory: [
    'Which services are hardest to reach from Bandani and Obunga?',
    'How should referrals be balanced when a facility is full?',
    'What should the referral directory record for each facility?',
  ],
  'Pilot M&E': [
    'Which indicators are furthest from target, and what would move them?',
    'How should sensitivity and specificity of the screening rules be measured?',
    'How do we avoid reading more screening as more illness?',
  ],
  'Data & Governance': [
    'What must a Data Protection Impact Assessment cover for this pilot?',
    'How should referral records for adolescents be protected?',
    'What should the county check before connecting to KenyaEMR?',
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
      content: `**Jambo.** I help health workers in the Kisumu mental health referral and linkage pilot, powered by Ivula Technologies.

I can help you:

- **Understand screening results** and what the referral rules mean
- **Write clear referral notes** and feedback to CHPs
- **Plan follow-up** for missed appointments
- **Read the pathway figures** and spot where people are getting lost

I don't diagnose, and I never handle emergencies. **If someone may harm themselves or others, stop and phone the on-call clinician now.**`,
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
          content: `**The assistant could not answer**\n\n${err.message || 'Unable to complete the request.'}`,
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
            <h2>Referral copilot</h2>
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
          <span>Pseudonymised data only. Not for emergencies.</span>
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
