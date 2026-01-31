import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThreadRepository } from './ThreadRepository.js';
import { CommentRepository } from './CommentRepository.js';
import { CreateThreadInput, PostCommentInput } from './types.js';

const threadRepo = new ThreadRepository();
const commentRepo = new CommentRepository();

export const useThreads = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['threads', page, limit],
    queryFn: () => threadRepo.list(page, limit),
  });
};

export const useThread = (id: string) => {
  return useQuery({
    queryKey: ['thread', id],
    queryFn: () => threadRepo.getById(id),
    enabled: !!id,
  });
};

export const useCreateThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateThreadInput) => threadRepo.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
};

export const usePostComment = (threadId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PostCommentInput) => commentRepo.create(threadId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
    },
  });
};
