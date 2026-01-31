import React from 'react';
import { Comment } from '../types.js';
import { User, Clock } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <div className="p-4 rounded-lg bg-gray-50/50 border border-gray-100 flex flex-col space-y-2">
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-1 font-medium text-gray-500">
          <User size={10} />
          {comment.authorId.substring(0, 8)}...
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">
        {comment.content}
      </p>
    </div>
  );
};
