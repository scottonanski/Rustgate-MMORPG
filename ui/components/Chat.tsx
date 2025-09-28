import React from 'react';
import type { ChatMsg } from '../state/uiStore.ts';

interface ChatProps {
  messages: ChatMsg[];
  playerName: string;
  scrollRef?: React.Ref<HTMLDivElement>;
}

export const Chat: React.FC<ChatProps> = ({ messages, playerName, scrollRef }) => {
  return (
    <div ref={scrollRef} className="chat-window" role="log" aria-live="polite">
      <ul className="chat-list">
        {messages.map(m => {
          const isGM = m.sender === 'gm';
          const label = isGM ? 'Game Master' : playerName;
          const cls = isGM ? 'chat-message chat-message--gm' : 'chat-message chat-message--player';
          return (
            <li key={m.id} className={cls}>
              <div className="chat-message__label">{label}</div>
              <div className="chat-bubble">{m.text}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
