import React from 'react';
import { ThreadItem } from './ThreadItem.js';
import { useThreads } from '../BbsService.js';
import { Skeleton } from '@gxp/design-system';

export const ThreadList: React.FC = () => {
  const { data, isLoading, error } = useThreads();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
        Failed to load threads. Please try again later.
      </div>
    );
  }

  if (!data?.threads.length) {
    return (
      <div className="p-12 text-center bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500">No threads found. Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.threads.map((thread) => (
        <ThreadItem key={thread.id} thread={thread} />
      ))}
    </div>
  );
};
