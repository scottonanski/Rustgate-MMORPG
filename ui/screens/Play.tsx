
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUiStore } from '../state/uiStore.ts';
import { Chat } from '../components/Chat.tsx';
import { createEngine, GameEngine } from '../../engine/engine.ts';
import type { EngineIO, Prompt } from '../../engine/types.ts';

const OFFLINE_NARRATION = {
    narration: "The world feels strangely silent. Your chosen Game Master is offline. You can still explore, but the story will not advance.",
    options: ["Check your gear", "Look around", "Ponder your existence"]
};

export const PlayScreen: React.FC = () => {
    const { messages, addMessage, adapters, selectedAdapterId, playerName } = useUiStore();
    const [engine, setEngine] = useState<GameEngine | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [latestOptions, setLatestOptions] = useState<string[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const startedAdapterRef = useRef<string | null>(null);

    useEffect(() => {
        // Auto-scroll to bottom
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages, latestOptions]);

    useEffect(() => {
        if (!selectedAdapterId) return;

        const adapter = adapters.find(a => a.id === selectedAdapterId);
        if (!adapter) return;

        const io: EngineIO = {
            narrate: async (prompt: Prompt) => {
                const { isHealthy } = await adapter.health();
                if (!isHealthy) {
                    return `${OFFLINE_NARRATION.narration}\n\n- ${OFFLINE_NARRATION.options.join('\n- ')}`;
                }
                return adapter.generate({ system: prompt.system, user: prompt.user });
            }
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
            const intro = await newEngine.runTurn({ command: "I have just arrived in Rustgate. Describe my surroundings and what I see first." });
            addMessage({ sender: 'gm', text: intro.narration });
            setLatestOptions(intro.options);
            setIsThinking(false);
            inputRef.current?.focus();
        };

        startNewGame();
    }, [selectedAdapterId, adapters, addMessage]);

    const handleSend = useCallback(async (command: string) => {
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
    }, [engine, addMessage, isThinking]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend(inputValue);
    };

    const handleChipClick = (option: string) => {
        setInputValue(option);
        inputRef.current?.focus();
    };

    return (
        <div className="screen screen--play">
            <div className="chat-container">
                <Chat messages={messages} playerName={playerName} scrollRef={chatScrollRef} />
            </div>
            {latestOptions.length > 0 && !isThinking && (
              <div className="options-bar">
                <div className="options-bar__inner">
                  {latestOptions.map((opt, i) => (
                    <button
                      key={i}
                      className="badge badge-lg badge-outline cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => handleChipClick(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <form className="input-bar" onSubmit={handleSubmit}>
                <div className="flex w-full max-w-4xl mx-auto gap-3 items-end">
                    <input
                        ref={inputRef}
                        type="text"
                        className="input input-bordered flex-1"
                        placeholder={isThinking ? "Game Master is thinking..." : "What do you do?"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isThinking}
                        aria-label="Enter your action"
                    />
                    <button type="submit" className="btn btn-primary" disabled={isThinking || !inputValue.trim()}>
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};
