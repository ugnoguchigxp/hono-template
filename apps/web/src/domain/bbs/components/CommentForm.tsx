import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Textarea } from '@gxp/design-system';
import { usePostComment } from '../BbsService.js';
import { Reply } from 'lucide-react';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  threadId: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({ threadId }) => {
  const postComment = usePostComment(threadId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (data: CommentFormData) => {
    try {
      await postComment.mutateAsync(data);
      reset();
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        {...register('content')}
        placeholder="Add a comment..."
        rows={3}
        className="bg-white/80 backdrop-blur-sm"
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting ? 'Posting...' : (
            <span className="flex items-center gap-2">
              <Reply size={14} />
              Post Comment
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};
