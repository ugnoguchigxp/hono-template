import { createRoute } from '@tanstack/react-router';
import {
  type SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MessageCircle, Pencil, Search, Trash2, X } from 'lucide-react';
import React from 'react';
import { rootRoute } from '../../routes/__root.js';
import {
  useChatSessions,
  useCreateChatMessage,
  useCreateChatSession,
  useDeleteChatSession,
  useInfiniteChatMessages,
  useSearchMessages,
  useUpdateChatSession,
} from './ChatService.js';
import type { ChatMessage, ChatSearchResult, ChatSession, ChatSort } from './types.js';

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

const toSort = (sorting: SortingState, fallback: ChatSort): ChatSort => {
  if (!sorting.length) return fallback;
  return {
    sortBy: sorting[0].id,
    sortDir: sorting[0].desc ? 'desc' : 'asc',
  };
};

function ChatSessionsPage() {
  const [sessionTitle, setSessionTitle] = React.useState('');
  const [channel, setChannel] = React.useState('discord');
  const [searchInput, setSearchInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editing, setEditing] = React.useState<ChatSession | null>(null);
  const [activeSession, setActiveSession] = React.useState<SessionSummary | null>(null);
  const [sessionSorting, setSessionSorting] = React.useState<SortingState>([
    { id: 'updatedAt', desc: true },
  ]);
  const [searchSorting, setSearchSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);

  const isSearchMode = searchQuery.trim().length > 0;
  const sessionSort = React.useMemo(
    () => toSort(sessionSorting, { sortBy: 'updatedAt', sortDir: 'desc' }),
    [sessionSorting]
  );
  const resultSort = React.useMemo(
    () => toSort(searchSorting, { sortBy: 'createdAt', sortDir: 'desc' }),
    [searchSorting]
  );

  const { data: sessions = [], isLoading: isLoadingSessions } = useChatSessions(
    undefined,
    sessionSort
  );
  const { data: searchResults = [], isLoading: isLoadingSearch } = useSearchMessages(
    searchQuery,
    resultSort
  );

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
    await createSession.mutateAsync({ title: sessionTitle, channel });
    setSessionTitle('');
  };

  const formatDate = React.useCallback((date: string) => {
    try {
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    } catch {
      return date;
    }
  }, []);

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
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            type="submit"
          >
            Search
          </button>
          {isSearchMode && (
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
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
        <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="mb-4 border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
            Create New Session
          </h3>
          <form onSubmit={onCreateSession} className="space-y-4">
            <div>
              <label
                htmlFor="session-title"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Session Title
              </label>
              <input
                id="session-title"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter title"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="session-channel"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Channel
              </label>
              <input
                id="session-channel"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter channel (e.g. discord)"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              />
            </div>
            <button
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              type="submit"
            >
              Create
            </button>
          </form>
        </section>

        <section className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              {isSearchMode ? (
                <SearchResultsTable
                  data={searchResults}
                  isLoading={isLoadingSearch}
                  sorting={searchSorting}
                  onSortingChange={setSearchSorting}
                  formatDate={formatDate}
                  openSessionModal={setActiveSession}
                  searchQuery={searchQuery}
                />
              ) : (
                <SessionsTable
                  data={sessions}
                  isLoading={isLoadingSessions}
                  sorting={sessionSorting}
                  onSortingChange={setSessionSorting}
                  formatDate={formatDate}
                  onOpen={(session) => setActiveSession(session)}
                  onEdit={(session) => setEditing(session)}
                  onDelete={async (sessionId) => {
                    if (!window.confirm('Delete this session?')) return;
                    await deleteSession.mutateAsync(sessionId);
                  }}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {editing && (
        <EditSessionModal editing={editing} setEditing={setEditing} updateSession={updateSession} />
      )}

      {activeSession && (
        <ActiveSessionModal
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

function SortHeader({
  label,
  onClick,
  state,
  canSort,
}: {
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  state: false | 'asc' | 'desc';
  canSort: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canSort}
      className={`inline-flex items-center gap-1 ${canSort ? 'hover:text-blue-700' : ''}`}
    >
      <span>{label}</span>
      {canSort && (
        <span className="text-xs text-slate-400">
          {state === 'asc' ? '▲' : state === 'desc' ? '▼' : '⇅'}
        </span>
      )}
    </button>
  );
}

function SessionsTable({
  data,
  isLoading,
  sorting,
  onSortingChange,
  formatDate,
  onOpen,
  onEdit,
  onDelete,
}: {
  data: ChatSession[];
  isLoading: boolean;
  sorting: SortingState;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;
  formatDate: (date: string) => string;
  onOpen: (session: SessionSummary) => void;
  onEdit: (session: ChatSession) => void;
  onDelete: (sessionId: string) => Promise<void>;
}) {
  const columnHelper = createColumnHelper<ChatSession>();
  const columns = React.useMemo(
    () => [
      columnHelper.accessor('title', {
        header: ({ column }) => (
          <SortHeader
            label="Title"
            onClick={column.getToggleSortingHandler()}
            state={column.getIsSorted()}
            canSort={column.getCanSort()}
          />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-semibold text-slate-800 transition-colors hover:text-blue-700"
            onClick={() =>
              onOpen({
                id: row.original.id,
                title: row.original.title,
                channel: row.original.channel,
              })
            }
          >
            {row.original.title}
          </button>
        ),
      }),
      columnHelper.accessor('channel', {
        header: ({ column }) => (
          <SortHeader
            label="Channel"
            onClick={column.getToggleSortingHandler()}
            state={column.getIsSorted()}
            canSort={column.getCanSort()}
          />
        ),
        cell: ({ getValue }) => (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/10">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('updatedAt', {
        header: ({ column }) => (
          <SortHeader
            label="Updated"
            onClick={column.getToggleSortingHandler()}
            state={column.getIsSorted()}
            canSort={column.getCanSort()}
          />
        ),
        cell: ({ getValue }) => <span className="text-slate-500">{formatDate(getValue())}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-blue-600"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 transition-all hover:bg-rose-50"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, formatDate, onDelete, onEdit, onOpen]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableSortingRemoval: false,
  });

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
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-slate-300 bg-slate-50 text-slate-700">
            {headerGroup.headers.map((header) => (
              <th key={header.id} className="px-5 py-3 text-left font-semibold">
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="group border-b border-slate-200 transition-colors hover:bg-slate-50"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-5 py-4">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td className="p-12 text-center" colSpan={4}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MessageCircle className="h-6 w-6" />
              </div>
              <p className="text-base font-medium text-slate-600">セッションがまだありません。</p>
              <p className="mt-1 text-sm text-slate-500">
                新しいセッションを作成して会話を始めましょう。
              </p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function SearchResultsTable({
  data,
  isLoading,
  sorting,
  onSortingChange,
  formatDate,
  openSessionModal,
  searchQuery,
}: {
  data: ChatSearchResult[];
  isLoading: boolean;
  sorting: SortingState;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;
  formatDate: (date: string) => string;
  openSessionModal: (session: SessionSummary) => void;
  searchQuery: string;
}) {
  const columnHelper = createColumnHelper<ChatSearchResult>();
  const columns = React.useMemo(
    () => [
      columnHelper.accessor('title', {
        header: ({ column }) => (
          <SortHeader
            label="Session"
            onClick={column.getToggleSortingHandler()}
            state={column.getIsSorted()}
            canSort={column.getCanSort()}
          />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-semibold text-slate-800 transition-colors hover:text-blue-700"
            onClick={() =>
              openSessionModal({
                id: row.original.sessionId,
                title: row.original.title,
                channel: row.original.channel,
              })
            }
          >
            {row.original.title}
          </button>
        ),
      }),
      columnHelper.accessor('channel', {
        header: ({ column }) => (
          <SortHeader
            label="Channel"
            onClick={column.getToggleSortingHandler()}
            state={column.getIsSorted()}
            canSort={column.getCanSort()}
          />
        ),
        cell: ({ getValue }) => (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/10">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('content', {
        header: ({ column }) => (
          <SortHeader
            label="Message"
            onClick={column.getToggleSortingHandler()}
            state={column.getIsSorted()}
            canSort={column.getCanSort()}
          />
        ),
        cell: ({ getValue }) => <span className="text-slate-600">{getValue()}</span>,
      }),
      columnHelper.accessor('createdAt', {
        header: ({ column }) => (
          <SortHeader
            label="Created"
            onClick={column.getToggleSortingHandler()}
            state={column.getIsSorted()}
            canSort={column.getCanSort()}
          />
        ),
        cell: ({ getValue }) => <span className="text-slate-500">{formatDate(getValue())}</span>,
      }),
    ],
    [columnHelper, formatDate, openSessionModal]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableSortingRemoval: false,
  });

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
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-slate-300 bg-slate-50 text-slate-700">
            {headerGroup.headers.map((header) => (
              <th key={header.id} className="px-5 py-3 text-left font-semibold">
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="group border-b border-slate-200 transition-colors hover:bg-slate-50"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-5 py-4">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td className="p-12 text-center" colSpan={4}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-base font-medium text-slate-600">
                「{searchQuery}」に一致するメッセージはありません。
              </p>
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
      <dialog
        open
        className="w-full max-w-md rounded-lg border border-slate-300 bg-white shadow-xl"
        aria-labelledby="edit-session-title"
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 id="edit-session-title" className="text-base font-semibold text-slate-900">
            Edit Session
          </h3>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="edit-title" className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="edit-title"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="edit-channel" className="mb-1 block text-sm font-medium text-slate-700">
              Channel
            </label>
            <input
              id="edit-channel"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 rounded-b-lg border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => setEditing(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            onClick={async () => {
              await updateSession.mutateAsync({ sessionId: editing.id, title, channel });
              setEditing(null);
            }}
          >
            Save
          </button>
        </div>
      </dialog>
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
}) {
  const [localMessage, setLocalMessage] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteChatMessages(activeSession.id, 50);
  const createMessage = useCreateChatMessage(activeSession.id);

  const messages = React.useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const onScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const threshold = 120;
      if (!hasNextPage || isFetchingNextPage) return;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - threshold) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localMessage.trim()) return;
    await createMessage.mutateAsync({ role: 'user', content: localMessage, sender: 'yuji' });
    setLocalMessage('');
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => setActiveSession(null)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setActiveSession(null);
      }}
      role="presentation"
      tabIndex={-1}
    >
      <dialog
        open
        className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        aria-labelledby="active-session-title"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3
              id="active-session-title"
              className="inline-flex items-center gap-3 text-lg font-bold text-slate-900"
            >
              {activeSession.title}
              <span className="rounded-md border border-slate-300 bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                {activeSession.channel}
              </span>
            </h3>
          </div>
          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-500"
            onClick={() => setActiveSession(null)}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-6"
          onScroll={onScroll}
        >
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
              className={`flex flex-col rounded-lg border p-4 shadow-sm ${
                m.role === 'user'
                  ? 'ml-auto max-w-[80%] border-blue-200 bg-blue-50 text-slate-900'
                  : 'mr-auto max-w-[80%] border-slate-200 bg-white text-slate-900'
              }`}
            >
              <div
                className={`mb-1 text-xs font-semibold ${m.role === 'user' ? 'text-blue-700' : 'text-slate-600'}`}
              >
                <span className="uppercase">{m.sender ?? m.role}</span>
                <span className="ml-2 font-normal text-slate-400">{formatDate(m.createdAt)}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {m.content}
              </div>
            </article>
          ))}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
          )}
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
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
