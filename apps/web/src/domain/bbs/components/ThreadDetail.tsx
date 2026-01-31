import React from 'react';
import { useThread } from '../BbsService.js';
import { CommentItem } from './CommentItem.js';
import { CommentForm } from './CommentForm.js';
import { Card, Separator, Skeleton, Button } from '@gxp/design-system';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, User, Clock, MessageCircle } from 'lucide-react';

interface ThreadDetailProps {
  threadId: string;
}

export const ThreadDetail: React.FC<ThreadDetailProps> = ({ threadId }) => {
  const { data: thread, isLoading, error } = useThread(threadId);

  if (isLoading) {
    return (
      <Card className="p-8 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  if (error || !thread) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
        Failed to load thread details.
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link to="/bbs">Go Back to BBS</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/bbs" className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to List
        </Link>
      </Button>

      <Card className="overflow-hidden border-white/20 bg-white/40 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {thread.title}
          </h1>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-8 pb-4 border-b border-gray-100">
            <span className="flex items-center gap-1">
              <User size={14} className="text-blue-500" />
              Authored by <span className="font-semibold text-gray-700">{thread.authorId.substring(0, 8)}...</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-indigo-500" />
              Published on <span className="font-semibold text-gray-700">{new Date(thread.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed mb-10">
            {thread.content}
          </div>

          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <MessageCircle size={20} className="text-indigo-600" />
              Comments ({thread.comments.length})
            </div>
            
            <CommentForm threadId={thread.id} />
            
            <Separator className="bg-gray-100" />

            <div className="space-y-4">
              {thread.comments.length > 0 ? (
                thread.comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))
              ) : (
                <p className="text-center py-8 text-gray-400 italic">No comments yet. Start the conversation!</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
