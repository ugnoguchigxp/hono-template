import React from 'react';
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../../routes/__root.js';
import type { ChatMessage, ChatSession } from './types.js';
import {
  useChatMessages,
  useChatSessions,
  useCreateChatMessage,
  useCreateChatSession,
  useDeleteChatSession,
  useSearchMessages,
  useUpdateChatSession,
} from './ChatService.js';
import { MessageCircle, Pencil, Search, Trash2, X } from 'lucide-react';

export const chatSessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat-sessions',
  component: ChatSessionsPage,
});

type SessionSummary = {
  id: string;
  title: string;
  channel: string;
};

function ChatSessionsPage() {
  const [sessionTitle, setSessionTitle] = React.useState('');
  const [channel, setChannel] = React.useState('discord');
  const [selectedSessionId, setSelectedSessionId] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editing, setEditing] = React.useState<ChatSession | null>(null);
  const [activeSession, setActiveSession] = React.useState<SessionSummary | null>(null);

  const { data: sessions = [], isLoading } = useChatSessions();
  const { data: searchResults = [] } = useSearchMessages(searchQuery);
  const isSearchMode = searchQuery.trim().length > 0;

  const createSession = useCreateChatSession();
  const updateSession = useUpdateChatSession();
  const deleteSession = useDeleteChatSession();

  React.useEffect(() => {
    if (!activeSession) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveSession(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSession]);

  const onCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;
    const created = await createSession.mutateAsync({ title: sessionTitle, channel });
    setSessionTitle('');
    setSelectedSessionId(created.id);
  };

  const openSessionModal = (session: SessionSummary) => {
    setSelectedSessionId(session.id);
    setActiveSession(session);
  };

  const formatter = React.useMemo(() => new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }), []);

  const formatDate = React.useCallback((date: string) => {
    try {
      return formatter.format(new Date(date));
    } catch {
      return date;
    }
  }, [formatter]);

  // Use the new extracted component instead of the inline useMemo block
  const renderedTable = (
    <SessionTable
      sessions={sessions}
      searchResults={searchResults}
      isSearchMode={isSearchMode}
      isLoading={isLoading}
      formatDate={formatDate}
      openSessionModal={openSessionModal}
      searchQuery={searchQuery}
      setEditing={setEditing}
      deleteSession={deleteSession}
      selectedSessionId={selectedSessionId}
      setSelectedSessionId={setSelectedSessionId}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Chat Sessions</h2>
          <p className="text-sm text-slate-500">Manage sessions and view conversation history.</p>
        </div>
        <form
          className="flex w-full max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchQuery(searchInput.trim());
          }}
        >
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search messages..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            type="submit"
          >
            Search
          </button>
          {isSearchMode && (
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Form Section */}
        <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="mb-4 text-base font-semibold text-slate-900 border-b border-slate-200 pb-2">Create New Session</h3>
          <form onSubmit={onCreateSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Session Title</label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter title"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter channel (e.g. discord)"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              />
            </div>
            <button
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
            >
              Create
            </button>
          </form>
        </section>

        {/* Data Table Section */}
        <section className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              {renderedTable}
            </div>
          </div>
        </section>
      </div>

      {editing && (
        <EditSessionModal
          editing={editing}
          setEditing={setEditing}
          updateSession={updateSession}
        />
      )}

      {activeSession && (
        <ActiveSessionModal
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          queryClient={null /* We don't strictly need it if we use mutations directly */}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function SessionTable({
  sessions,
  searchResults,
  isSearchMode,
  isLoading,
  formatDate,
  openSessionModal,
  searchQuery,
  setEditing,
  deleteSession,
  selectedSessionId,
  setSelectedSessionId,
}: {
  sessions: ChatSession[];
  searchResults: any[];
  isSearchMode: boolean;
  isLoading: boolean;
  formatDate: (date: string) => string;
  openSessionModal: (session: SessionSummary) => void;
  searchQuery: string;
  setEditing: (session: ChatSession | null) => void;
  deleteSession: ReturnType<typeof useDeleteChatSession>;
  selectedSessionId: string;
  setSelectedSessionId: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }
  return (
    <table className="w-full border-collapse text-sm border-t border-slate-200">
      <thead>
        <tr className="border-b border-slate-300 bg-slate-50 text-slate-700">
          <th className="px-5 py-3 text-left font-semibold">{isSearchMode ? 'Session' : 'Title'}</th>
          <th className="px-5 py-3 text-left font-semibold">Channel</th>
          <th className="px-5 py-3 text-left font-semibold">{isSearchMode ? 'Message' : 'Updated'}</th>
          <th className="px-5 py-3 text-left font-semibold">{isSearchMode ? 'Created' : 'Actions'}</th>
        </tr>
      </thead>
      <tbody>
        {!isSearchMode &&
          sessions.map((session) => (
            <tr key={session.id} className="group border-b border-slate-200 transition-colors hover:bg-slate-50">
              <td className="px-5 py-4">
                <button
                  type="button"
                  className="text-left font-bold text-slate-800 transition-colors group-hover:text-blue-600"
                  onClick={() =>
                    openSessionModal({
                      id: session.id,
                      title: session.title,
                      channel: session.channel,
                    })
                  }
                >
                  {session.title}
                </button>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/10">
                  {session.channel}
                </span>
              </td>
              <td className="px-5 py-4 text-slate-500">{formatDate(session.updatedAt)}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-blue-600"
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setEditing(session);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 transition-all hover:bg-rose-50"
                    onClick={async () => {
                      if (!window.confirm('Delete this session?')) return;
                      await deleteSession.mutateAsync(session.id);
                      if (selectedSessionId === session.id) setSelectedSessionId('');
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}

        {isSearchMode &&
          searchResults.map((result) => (
            <tr key={result.messageId} className="group border-b border-slate-200 transition-colors hover:bg-slate-50">
              <td className="px-5 py-4">
                <button
                  type="button"
                  className="text-left font-bold text-slate-800 transition-colors group-hover:text-blue-600"
                  onClick={() =>
                    openSessionModal({
                      id: result.sessionId,
                      title: result.title,
                      channel: result.channel,
                    })
                  }
                >
                  {result.title}
                </button>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/10">
                  {result.channel}
                </span>
              </td>
              <td className="max-w-lg px-5 py-4 text-slate-600">{result.content}</td>
              <td className="px-5 py-4 text-slate-500">{formatDate(result.createdAt)}</td>
            </tr>
          ))}

        {!isSearchMode && sessions.length === 0 && (
          <tr>
            <td className="p-12 text-center" colSpan={4}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MessageCircle className="h-6 w-6" />
              </div>
              <p className="text-base font-medium text-slate-600">セッションがまだありません。</p>
              <p className="mt-1 text-sm text-slate-500">新しいセッションを作成して会話を始めましょう。</p>
            </td>
          </tr>
        )}

        {isSearchMode && searchResults.length === 0 && (
          <tr>
            <td className="p-12 text-center" colSpan={4}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-base font-medium text-slate-600">「{searchQuery}」に一致するメッセージはありません。</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function EditSessionModal({
  editing,
  setEditing,
  updateSession,
}: {
  editing: ChatSession;
  setEditing: (session: ChatSession | null) => void;
  updateSession: ReturnType<typeof useUpdateChatSession>;
}) {
  const [title, setTitle] = React.useState(editing.title);
  const [channel, setChannel] = React.useState(editing.channel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <section
        className="w-full max-w-md rounded-lg border border-slate-300 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-session-title"
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 id="edit-session-title" className="text-base font-semibold text-slate-900">
            Edit Session
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 rounded-b-lg">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => setEditing(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={async () => {
              await updateSession.mutateAsync({
                sessionId: editing.id,
                title,
                channel,
              });
              setEditing(null);
            }}
          >
            Save
          </button>
        </div>
      </section>
    </div>
  );
}

function ActiveSessionModal({
  activeSession,
  setActiveSession,
  formatDate,
}: {
  activeSession: SessionSummary;
  setActiveSession: (session: SessionSummary | null) => void;
  formatDate: (date: string) => string;
  queryClient?: any;
}) {
  const [localMessage, setLocalMessage] = React.useState('');
  const { data: messages = [], isLoading } = useChatMessages(activeSession.id);
  const createMessage = useCreateChatMessage(activeSession.id);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localMessage.trim()) return;
    await createMessage.mutateAsync({ role: 'user', content: localMessage, sender: 'yuji' });
    setLocalMessage('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => setActiveSession(null)}
      role="presentation"
    >
      <section
        className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-session-title"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3 id="active-session-title" className="text-lg font-bold text-slate-900 inline-flex items-center gap-3">
              {activeSession.title}
              <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-300">
                {activeSession.channel}
              </span>
            </h3>
          </div>
          <button
            type="button"
            className="rounded text-slate-400 hover:bg-slate-200 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 p-1"
            onClick={() => setActiveSession(null)}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-slate-50/50">
          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
          )}
          {!isLoading && messages.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium">No messages in this session yet.</p>
            </div>
          )}
          {messages.map((m: ChatMessage) => (
            <article
              key={m.id}
              className={`flex flex-col rounded-lg p-4 shadow-sm border ${m.role === 'user'
                ? 'ml-auto max-w-[80%] bg-blue-50 text-slate-900 border-blue-200'
                : 'mr-auto max-w-[80%] bg-white text-slate-900 border-slate-200'
                }`}
            >
              <div className={`mb-1 text-xs font-semibold ${m.role === 'user' ? 'text-blue-700' : 'text-slate-600'}`}>
                <span className="uppercase">{m.sender ?? m.role}</span>
                <span className="text-slate-400 font-normal ml-2">{formatDate(m.createdAt)}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {m.content}
              </div>
            </article>
          ))}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
          <form onSubmit={onSend} className="flex gap-2">
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Type a message..."
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
            />
            <button
              type="submit"
              disabled={!localMessage.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
