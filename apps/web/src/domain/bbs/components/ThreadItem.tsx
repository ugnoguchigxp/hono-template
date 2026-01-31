import React from 'react';
import { Card, Button, Badge } from '@gxp/design-system';
import { Thread } from '../types.js';
import { Link } from '@tanstack/react-router';
import { MessageSquare, User, Clock } from 'lucide-react';

interface ThreadItemProps {
  thread: Thread;
}

export const ThreadItem: React.FC<ThreadItemProps> = ({ thread }) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-white/20 bg-white/40 backdrop-blur-md group">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <Link 
            to="/bbs/$threadId" 
            params={{ threadId: thread.id }}
            className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors"
          >
            {thread.title}
          </Link>
          <Badge variant="secondary" className="flex items-center gap-1">
            <MessageSquare size={14} />
            {thread.commentCount}
          </Badge>
        </div>
        
        <p className="text-gray-600 line-clamp-2 text-sm">
          {thread.content}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User size={12} />
              {thread.authorId.substring(0, 8)}...
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(thread.createdAt).toLocaleDateString()}
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/bbs/$threadId" params={{ threadId: thread.id }}>
              Read More
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};
