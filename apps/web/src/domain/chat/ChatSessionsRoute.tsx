import React from 'react';
import { createRoute } from '@tanstack/react-router';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { rootRoute } from '../../routes/__root.js';
import type { ChatMessage, ChatSearchResult, ChatSession } from './types.js';
import {
  useChatMessages,
  useChatSessions,
  useCreateChatMessage,
  useCreateChatSession,
  useDeleteChatSession,
  useSearchMessages,
  useUpdateChatSession,
} from './ChatService.js';

export const chatSessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat-sessions',
  component: ChatSessionsPage,
});

const sessionCol = createColumnHelper<ChatSession>();
const searchCol = createColumnHelper<ChatSearchResult>();

function ChatSessionsPage() {
  const [sessionTitle, setSessionTitle] = React.useState('');
  const [channel, setChannel] = React.useState('discord');
  const [selectedSessionId, setSelectedSessionId] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editing, setEditing] = React.useState<ChatSession | null>(null);

  const { data: sessions = [], isLoading } = useChatSessions();
  const { data: messages = [] } = useChatMessages(selectedSessionId);
  const { data: searchResults = [] } = useSearchMessages(searchQuery);

  const createSession = useCreateChatSession();
  const updateSession = useUpdateChatSession();
  const deleteSession = useDeleteChatSession();
  const createMessage = useCreateChatMessage(selectedSessionId);

  const sessionTable = useReactTable({
    data: sessions,
    columns: [
      sessionCol.accessor('title', { header: 'Title' }),
      sessionCol.accessor('channel', { header: 'Channel' }),
      sessionCol.accessor('updatedAt', {
        header: 'Updated',
        cell: (ctx) => new Date(ctx.getValue()).toLocaleString(),
      }),
      sessionCol.display({
        id: 'actions',
        header: 'Actions',
        cell: (ctx) => {
          const row = ctx.row.original;
          return (
            <div className="flex gap-2">
              <button
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setSelectedSessionId(row.id)}
              >
                Open
              </button>
              <button
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setEditing(row)}
              >
                Edit
              </button>
              <button
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
                onClick={async () => {
                  if (!window.confirm('Delete this session?')) return;
                  await deleteSession.mutateAsync(row.id);
                  if (selectedSessionId === row.id) setSelectedSessionId('');
                }}
              >
                Delete
              </button>
            </div>
          );
        },
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const searchTable = useReactTable({
    data: searchResults,
    columns: [
      searchCol.accessor('channel', { header: 'Channel' }),
      searchCol.accessor('title', { header: 'Session' }),
      searchCol.accessor('content', { header: 'Content' }),
      searchCol.accessor('createdAt', {
        header: 'Created',
        cell: (ctx) => new Date(ctx.getValue()).toLocaleString(),
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

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
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Session CRUD</h2>

        <form onSubmit={onCreateSession} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            className="rounded border px-3 py-2 md:col-span-2"
            placeholder="Session title"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Create
          </button>
        </form>

        {editing && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 text-sm font-semibold">Edit Session</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                className="rounded border px-3 py-2"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                value={editing.channel}
                onChange={(e) => setEditing({ ...editing, channel: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded bg-blue-600 px-3 py-2 text-white"
                  onClick={async () => {
                    await updateSession.mutateAsync({
                      sessionId: editing.id,
                      title: editing.title,
                      channel: editing.channel,
                    });
                    setEditing(null);
                  }}
                >
                  Save
                </button>
                <button type="button" className="rounded border px-3 py-2" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p>Loading sessions...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                {sessionTable.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b bg-gray-50">
                    {hg.headers.map((h) => (
                      <th key={h.id} className="px-3 py-2 text-left font-semibold">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {sessionTable.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b ${row.original.id === selectedSessionId ? 'bg-indigo-50' : ''}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Search</h2>
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchQuery(searchInput.trim());
          }}
        >
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="Search messages (LIKE)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" type="submit">
            Search
          </button>
        </form>

        {searchQuery && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                {searchTable.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b bg-gray-50">
                    {hg.headers.map((h) => (
                      <th key={h.id} className="px-3 py-2 text-left font-semibold">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {searchTable.getRowModel().rows.map((row) => (
                  <tr key={row.original.messageId} className="border-b">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Messages ({selectedSessionId || 'select a session'})</h2>
        <form onSubmit={onCreateMessage} className="mb-4 space-y-2">
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={4}
            placeholder={selectedSessionId ? 'Write message...' : 'Select session first'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!selectedSessionId}
          />
          <button
            type="submit"
            disabled={!selectedSessionId}
            className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50"
          >
            Add Message
          </button>
        </form>

        <div className="space-y-2">
          {messages.map((m: ChatMessage) => (
            <div key={m.id} className="rounded border p-2 text-sm">
              <div className="text-xs text-gray-500">
                {m.role} / {m.sender ?? 'unknown'} / {new Date(m.createdAt).toLocaleString()}
              </div>
              <div>{m.content}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
