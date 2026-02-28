import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatRepository } from './ChatRepository.js';

const repo = new ChatRepository();

export const useChatSessions = (query?: string) => useQuery({
  queryKey: ['chatSessions', query ?? ''],
  queryFn: () => repo.listSessions(query),
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

export const useChatMessages = (sessionId: string, query?: string) => useQuery({
  queryKey: ['chatMessages', sessionId, query ?? ''],
  queryFn: () => repo.listMessages(sessionId, query),
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

export const useSearchMessages = (q: string) => useQuery({
  queryKey: ['chatSearch', q],
  queryFn: () => repo.searchMessages(q),
  enabled: q.trim().length > 0,
});
