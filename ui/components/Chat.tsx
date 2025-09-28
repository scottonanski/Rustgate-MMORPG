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
      <div className="chat-list">
        {messages.map((message) => {
          const isGM = message.sender === 'gm';
          const label = isGM ? 'Game Master' : playerName;

          if (isGM) {
            return (
              <div key={message.id} className="chat-message">
                <span className="chat-message__marker" aria-hidden="true" />
                <div className="chat-message__body">
                  <span className="chat-message__label">{label}</span>
                  <div className="chat-bubble">{message.text}</div>
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="chat-message chat-message--player">
              <div className="chat-message__body">
                <span className="chat-message__label">{label}</span>
                <div className="chat-bubble">{message.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
