import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatRepository } from './ChatRepository.js';
import type { ChatSort } from './types.js';

const repo = new ChatRepository();

export const useChatSessions = (query?: string, sort?: ChatSort) =>
  useQuery({
    queryKey: ['chatSessions', query ?? '', sort?.sortBy ?? 'updatedAt', sort?.sortDir ?? 'desc'],
    queryFn: () => repo.listSessions(query, sort),
  });

export const useCreateChatSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; channel: string }) => repo.createSession(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatSessions'] }),
  });
};

export const useUpdateChatSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sessionId: string; title: string; channel: string }) =>
      repo.updateSession(input.sessionId, { title: input.title, channel: input.channel }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatSessions'] }),
  });
};

export const useDeleteChatSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => repo.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
  });
};

export const useChatMessages = (sessionId: string, query?: string) =>
  useQuery({
    queryKey: ['chatMessages', sessionId, query ?? ''],
    queryFn: async () => (await repo.listMessages(sessionId, query)).data,
    enabled: !!sessionId,
  });

export const useInfiniteChatMessages = (sessionId: string, pageSize = 50) =>
  useInfiniteQuery({
    queryKey: ['chatMessages', sessionId, 'infinite', pageSize],
    queryFn: ({ pageParam }) =>
      repo.listMessages(sessionId, undefined, { limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.data.length < pageSize ? undefined : lastPage.offset + lastPage.limit,
    enabled: !!sessionId,
  });

export const useCreateChatMessage = (sessionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { role: string; content: string; sender?: string }) =>
      repo.createMessage(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
};

export const useSearchMessages = (q: string, sort?: ChatSort) =>
  useQuery({
    queryKey: ['chatSearch', q, sort?.sortBy ?? 'createdAt', sort?.sortDir ?? 'desc'],
    queryFn: () => repo.searchMessages(q, sort),
    enabled: q.trim().length > 0,
  });
