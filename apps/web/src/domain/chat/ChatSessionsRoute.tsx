import React from 'react';
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../../routes/__root.js';
import {
  useChatMessages,
  useChatSessions,
  useCreateChatMessage,
  useCreateChatSession,
  useSearchMessages,
} from './ChatService.js';

export const chatSessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat-sessions',
  component: ChatSessionsPage,
});

function ChatSessionsPage() {
  const [sessionTitle, setSessionTitle] = React.useState('');
  const [channel, setChannel] = React.useState('discord');
  const [selectedSessionId, setSelectedSessionId] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [searchText, setSearchText] = React.useState('');
  const [queryText, setQueryText] = React.useState('');

  const { data: sessions, isLoading } = useChatSessions();
  const createSession = useCreateChatSession();
  const { data: messages } = useChatMessages(selectedSessionId);
  const createMessage = useCreateChatMessage(selectedSessionId);
  const { data: searchResults } = useSearchMessages(queryText);

  const onCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    const created = await createSession.mutateAsync({ title: sessionTitle, channel });
    setSessionTitle('');
    setSelectedSessionId(created.id);
  };

  const onCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !message.trim()) return;

    await createMessage.mutateAsync({ role: 'user', content: message, sender: 'yuji' });
    setMessage('');
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-4 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Session CRUD</h2>

        <form onSubmit={onCreateSession} className="space-y-2">
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Session title"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
          />
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Channel (discord/webchat...)"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Create Session
          </button>
        </form>

        <div className="space-y-2">
          {isLoading && <p>Loading sessions...</p>}
          {sessions?.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSessionId(s.id)}
              className={`w-full rounded border px-3 py-2 text-left ${selectedSessionId === s.id ? 'border-black' : ''}`}
            >
              <div className="font-medium">{s.title}</div>
              <div className="text-xs text-gray-500">{s.channel}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Messages + LIKE Search</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQueryText(searchText);
          }}
          className="flex gap-2"
        >
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="Search with LIKE (e.g. OpenAI)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" type="submit">
            Search
          </button>
        </form>

        {queryText && (
          <div className="max-h-40 overflow-auto rounded border p-2 text-sm">
            {searchResults?.map((row) => (
              <div key={row.id} className="border-b py-1 last:border-0">
                <div className="font-medium">[{row.channel}] {row.title}</div>
                <div className="text-gray-700">{row.content}</div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onCreateMessage} className="space-y-2">
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={4}
            placeholder={selectedSessionId ? 'Write message to save...' : 'Select a session first'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!selectedSessionId}
          />
          <button
            className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50"
            type="submit"
            disabled={!selectedSessionId}
          >
            Add Message
          </button>
        </form>

        <div className="max-h-60 space-y-2 overflow-auto text-sm">
          {messages?.map((m) => (
            <div key={m.id} className="rounded border p-2">
              <div className="text-xs text-gray-500">{m.role} / {new Date(m.createdAt).toLocaleString()}</div>
              <div>{m.content}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
