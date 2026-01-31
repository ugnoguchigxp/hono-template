import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../../routes/__root.js';
import { ThreadList } from './components/ThreadList.js';
import { ThreadForm } from './components/ThreadForm.js';
import { Button } from '@gxp/design-system';
import { Plus } from 'lucide-react';
import React from 'react';

export const bbsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bbs',
  component: () => {
    const [showForm, setShowForm] = React.useState(false);

    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Community Board</h1>
            <p className="text-gray-500 mt-2 text-lg">Join the discussion and share your thoughts.</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="rounded-full px-6 shadow-lg hover:shadow-xl transition-all"
            variant={showForm ? "outline" : "default"}
          >
            <Plus className={`mr-2 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} size={18} />
            {showForm ? 'Cancel' : 'New Thread'}
          </Button>
        </div>

        {showForm && (
          <div className="animate-in zoom-in-95 duration-300">
            <ThreadForm onSuccess={() => setShowForm(false)} />
          </div>
        )}

        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[2rem] -z-10 opacity-50 blur-2xl" />
          <ThreadList />
        </div>
      </div>
    );
  },
});
