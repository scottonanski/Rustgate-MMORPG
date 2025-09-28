
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUiStore } from '../state/uiStore.ts';
import type { ChatMsg } from '../state/uiStore.ts';
import { Chat } from '../components/Chat.tsx';
import { createEngine, GameEngine } from '../../engine/engine.ts';
import type { EngineIO, Prompt } from '../../engine/types.ts';
import { snapshot } from '../../adapters/pmm/bridge.ts';

const OFFLINE_NARRATION = {
  narration:
    'The world feels strangely silent. Your chosen Game Master is offline. You can still explore, but the story will not advance.',
  options: ['Check your gear', 'Look around', 'Ponder your existence'],
};

const TONE_OPTIONS = [
  { value: 'neutral', label: 'Tone: Neutral' },
  { value: 'bold', label: 'Tone: Bold' },
  { value: 'cautious', label: 'Tone: Cautious' },
];

export const PlayScreen: React.FC = () => {
  const { messages, addMessage, adapters, selectedAdapterId, playerName } = useUiStore();
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [tone, setTone] = useState<typeof TONE_OPTIONS[number]['value']>('neutral');
  const [isThinking, setIsThinking] = useState(false);
  const [latestOptions, setLatestOptions] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const startedAdapterRef = useRef<string | null>(null);
  const [isAutoscroll, setIsAutoscroll] = useState(true);

  const storeSnapshot = useCallback((target: GameEngine | null) => {
    if (!target || typeof window === 'undefined') return;
    try {
      const data = snapshot(target);
      window.localStorage.setItem('rg:snap', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store snapshot:', error);
    }
  }, []);

  useEffect(() => {
    const node = chatScrollRef.current;
    if (!node) return;

    const handleScroll = () => {
      const autoscroll = node.scrollTop >= node.scrollHeight - node.clientHeight - 200;
      setIsAutoscroll(autoscroll);
    };

    handleScroll();
    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => node.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const node = chatScrollRef.current;
    if (!node || !isAutoscroll) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [messages, latestOptions, isAutoscroll]);

  useEffect(() => {
    if (!selectedAdapterId) return;

    const adapter = adapters.find((a) => a.id === selectedAdapterId);
    if (!adapter) return;

    const io: EngineIO = {
      narrate: async (prompt: Prompt) => {
        const { isHealthy } = await adapter.health();
        if (!isHealthy) {
          return `${OFFLINE_NARRATION.narration}\n\n- ${OFFLINE_NARRATION.options.join('\n- ')}`;
        }
        return adapter.generate({ system: prompt.system, user: prompt.user });
      },
    };

    const newEngine = createEngine(io);
    setEngine(newEngine);

    if (startedAdapterRef.current === selectedAdapterId) {
      return;
    }
    startedAdapterRef.current = selectedAdapterId;

    const startNewGame = async () => {
      setIsThinking(true);
      addMessage({ sender: 'gm', text: 'Welcome to Rustgate...' });
      const intro = await newEngine.runTurn({ command: 'I have just arrived in Rustgate. Describe my surroundings and what I see first.' });
      addMessage({ sender: 'gm', text: intro.narration });
      setLatestOptions(intro.options);
      setIsThinking(false);
      inputRef.current?.focus();
      storeSnapshot(newEngine);
    };

    startNewGame();
  }, [selectedAdapterId, adapters, addMessage, storeSnapshot]);

  const handleSend = useCallback(
    async (command: string) => {
      if (!command.trim() || !engine || isThinking) return;

      addMessage({ sender: 'player', text: command });
      setInputValue('');
      setLatestOptions([]);
      setIsThinking(true);

      const result = await engine.runTurn({ command });

      addMessage({ sender: 'gm', text: result.narration });
      setLatestOptions(result.options);
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 0);
      storeSnapshot(engine);
    },
    [engine, addMessage, isThinking, storeSnapshot],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSend(inputValue);
  };

  const handleChipClick = (option: string) => {
    setInputValue(option);
    inputRef.current?.focus();
  };

  const handleJumpToBottom = () => {
    const node = chatScrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    setIsAutoscroll(true);
  };

  const badgeData = useMemo(() => {
    const gmMessages = messages.filter((msg) => msg.sender === 'gm').length;
    const tension = Math.min(95, 40 + gmMessages * 4);
    const lastBeat = isThinking ? 'Resolving…' : latestOptions.length > 0 ? 'Choice Ready' : 'Awaiting Intent';
    return {
      season: 'Season • Clockwork Theft',
      tension: `Tension ${tension}`,
      persona: `GM Adapter: ${selectedAdapterId ?? 'offline'}`,
      lastBeat,
    };
  }, [messages, isThinking, latestOptions.length, selectedAdapterId]);

  return (
    <div className="play-shell">
      <TopBar badgeData={badgeData} />
      <div className="play-grid">
        <section className="play-grid__chat">
          <div className="play-card play-card--chat">
            <header className="play-header">
              <h2 className="play-header__title">The Infinite Masquerade</h2>
              <p className="play-header__subtitle">Chronicle: Rustgate</p>
            </header>
            <div className="chat-scroll">
              <Chat messages={messages} playerName={playerName} scrollRef={chatScrollRef} />
            </div>
            {latestOptions.length > 0 && !isThinking && (
              <OptionsPanel options={latestOptions} onSelect={handleChipClick} />
            )}
            <IntentBar
              onSubmit={handleSubmit}
              inputRef={inputRef}
              inputValue={inputValue}
              onInputChange={setInputValue}
              isThinking={isThinking}
              tone={tone}
              onToneChange={setTone}
            />
          </div>
        </section>

        <aside className="play-grid__rail">
          <div className="play-card play-card--caseboard">
            <h3 className="play-section-title">Caseboard</h3>
            <MysteryBoard messages={messages} latestOptions={latestOptions} />
          </div>
          <div className="play-card play-card--compact">
            <h3 className="play-section-title">Status</h3>
            <StatusPane isThinking={isThinking} optionsCount={latestOptions.length} tone={tone} selectedAdapterId={selectedAdapterId} />
          </div>
        </aside>
      </div>

      {!isAutoscroll && (
        <button type="button" className="jump-bottom" onClick={handleJumpToBottom}>
          Jump to latest
        </button>
      )}
    </div>
  );
};

interface TopBarProps {
  badgeData: {
    season: string;
    tension: string;
    persona: string;
    lastBeat: string;
  };
}

function TopBar({ badgeData }: TopBarProps) {
  return (
    <div className="play-topbar">
      <div className="play-topbar__inner">
        <div className="play-topbar__title">∞ The Infinite Masquerade</div>
        <div className="play-topbar__badges">
          <span className="play-badge">{badgeData.season}</span>
          <span className="play-badge">{badgeData.tension}</span>
          <span className="play-badge">{badgeData.persona}</span>
          <span className="play-badge">{badgeData.lastBeat}</span>
        </div>
      </div>
    </div>
  );
}

interface OptionsPanelProps {
  options: string[];
  onSelect: (option: string) => void;
}

function OptionsPanel({ options, onSelect }: OptionsPanelProps) {
  return (
    <div className="options-panel">
      <div className="options-panel__grid">
        {options.map((opt, index) => (
          <button key={`${opt}-${index}`} className="options-panel__button" onClick={() => onSelect(opt)}>
            <div className="options-panel__label">{opt}</div>
            <div className="options-panel__meta">Action</div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface IntentBarProps {
  onSubmit: (event: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  inputValue: string;
  onInputChange: (value: string) => void;
  isThinking: boolean;
  tone: string;
  onToneChange: (tone: typeof TONE_OPTIONS[number]['value']) => void;
}

function IntentBar({ onSubmit, inputRef, inputValue, onInputChange, isThinking, tone, onToneChange }: IntentBarProps) {
  return (
    <form className="intent-bar" onSubmit={onSubmit}>
      <div className="intent-bar__row">
        <select className="intent-bar__tone" value={tone} onChange={(event) => onToneChange(event.target.value as any)}>
          {TONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="text"
          className="intent-bar__input"
          placeholder={isThinking ? 'Game Master is thinking…' : 'Type your ambition…'}
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          disabled={isThinking}
          aria-label="Enter your action"
        />
        <button type="submit" className="intent-bar__send" disabled={isThinking || !inputValue.trim()}>
          Send
        </button>
      </div>
      <p className="intent-bar__hint">Pro tip: Describe intent + emotion. Example: “I quietly bribe the courier, acting casual but alert.”</p>
    </form>
  );
}

interface MysteryBoardProps {
  messages: ChatMsg[];
  latestOptions: string[];
}

function MysteryBoard({ messages, latestOptions }: MysteryBoardProps) {
  const gmMessages = [...messages]
    .filter((msg) => msg.sender === 'gm')
    .sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? ''));
  const playerMessages = [...messages]
    .filter((msg) => msg.sender === 'player')
    .sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? ''));

  const recentBeat = gmMessages[0];
  const trailingBeats = gmMessages.slice(1, 4);
  const recentIntents = playerMessages.slice(0, 3);
  const previewOptions = latestOptions.slice(0, 3);

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="mystery-board">
      <section className="mystery-board__row">
        <div className="mystery-board__row-header">
          <span>Scene Beat</span>
          <span>{formatTime(recentBeat?.ts)}</span>
        </div>
        <div className="mystery-board__row-title">{recentBeat?.text ?? 'Awaiting intel…'}</div>
        {previewOptions.length > 0 ? (
          <div className="mystery-board__chips">
            {previewOptions.map((option, index) => (
              <span key={`${option}-${index}`} className="mystery-board__chip">
                {option}
              </span>
            ))}
          </div>
        ) : (
          <span className="mystery-board__empty">Choose an action to surface leads.</span>
        )}
      </section>

      <section className="mystery-board__row">
        <div className="mystery-board__row-header">
          <span>Lead Log</span>
          <span>{trailingBeats.length ? `${trailingBeats.length} notes` : '—'}</span>
        </div>
        <div className="mystery-board__list">
          {trailingBeats.length > 0 ? (
            trailingBeats.map((msg) => (
              <div key={msg.id} className="mystery-board__list-item">
                <span className="mystery-board__list-text">{msg.text}</span>
                <span className="mystery-board__list-meta">{formatTime(msg.ts)}</span>
              </div>
            ))
          ) : (
            <span className="mystery-board__empty">No prior narration captured yet.</span>
          )}
        </div>
      </section>

      <section className="mystery-board__row">
        <div className="mystery-board__row-header">
          <span>Player Intent</span>
          <span>{recentIntents.length ? `${recentIntents.length} actions` : '—'}</span>
        </div>
        <div className="mystery-board__list">
          {recentIntents.length > 0 ? (
            recentIntents.map((msg) => (
              <div key={msg.id} className="mystery-board__list-item">
                <span className="mystery-board__list-text">{msg.text}</span>
                <span className="mystery-board__list-meta">{formatTime(msg.ts)}</span>
              </div>
            ))
          ) : (
            <span className="mystery-board__empty">Act to start logging your moves.</span>
          )}
        </div>
      </section>
    </div>
  );
}

interface StatusPaneProps {
  isThinking: boolean;
  optionsCount: number;
  tone: string;
  selectedAdapterId: string | null;
}

function StatusPane({ isThinking, optionsCount, tone, selectedAdapterId }: StatusPaneProps) {
  const statusItems = [
    { label: 'GM State', value: isThinking ? 'Resolving turn…' : 'Ready' },
    { label: 'Options Available', value: `${optionsCount}` },
    { label: 'Intent Tone', value: tone },
    { label: 'Adapter', value: selectedAdapterId ?? 'None' },
  ];

  return (
    <div className="status-grid">
      {statusItems.map((item) => (
        <div key={item.label} className="status-grid__item">
          <div className="status-grid__label">{item.label}</div>
          <div className="status-grid__value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
