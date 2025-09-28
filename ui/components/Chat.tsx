import React from 'react';
import type { ChatMsg } from '../state/uiStore.ts';

interface ChatProps {
  messages: ChatMsg[];
  playerName: string;
  scrollRef?: React.Ref<HTMLDivElement>;
}

type MessageGroup = { sender: ChatMsg['sender']; items: ChatMsg[] };

const groupMessages = (messages: ChatMsg[]): MessageGroup[] => {
  return messages.reduce<MessageGroup[]>((acc, message) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.sender === message.sender) {
      lastGroup.items.push(message);
      return acc;
    }
    acc.push({ sender: message.sender, items: [message] });
    return acc;
  }, []);
};

export const Chat: React.FC<ChatProps> = ({ messages, playerName, scrollRef }) => {
  const groups = groupMessages(messages);

  return (
    <div ref={scrollRef} className="chat-window" role="log" aria-live="polite">
      <ul className="chat-list">
        {groups.map((group, index) => {
          const isGM = group.sender === 'gm';
          const label = isGM ? 'Game Master' : playerName;
          const groupClass = `${isGM ? 'chat-message chat-message--gm' : 'chat-message chat-message--player'} chat-group`;

          return (
            <li key={`${group.items[0]?.id ?? index}-${index}`} className={groupClass}>
              <div className="chat-message__label">{label}</div>
              {group.items.map(item => (
                <div key={item.id} className="chat-bubble">{item.text}</div>
              ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
