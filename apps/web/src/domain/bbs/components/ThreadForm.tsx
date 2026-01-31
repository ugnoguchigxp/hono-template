import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Textarea, Card } from '@gxp/design-system';
import { useCreateThread } from '../BbsService.js';
import { Send } from 'lucide-react';

const threadSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

type ThreadFormData = z.infer<typeof threadSchema>;

interface ThreadFormProps {
  onSuccess?: () => void;
}

export const ThreadForm: React.FC<ThreadFormProps> = ({ onSuccess }) => {
  const createThread = useCreateThread();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ThreadFormData>({
    resolver: zodResolver(threadSchema),
  });

  const onSubmit = async (data: ThreadFormData) => {
    try {
      await createThread.mutateAsync(data);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  return (
    <Card className="p-6 border-white/20 bg-white/60 backdrop-blur-lg shadow-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Thread Title</label>
          <Input
            {...register('title')}
            placeholder="What's on your mind?"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Content</label>
          <Textarea
            {...register('content')}
            placeholder="Provide more details..."
            rows={5}
            className={errors.content ? 'border-red-500' : ''}
          />
          {errors.content && (
            <p className="text-xs text-red-500">{errors.content.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : (
            <span className="flex items-center gap-2">
              <Send size={16} />
              Create Thread
            </span>
          )}
        </Button>
      </form>
    </Card>
  );
};
