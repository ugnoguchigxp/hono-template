import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../../routes/__root.js';
import { ThreadDetail } from './components/ThreadDetail.js';

export const bbsDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bbs/$threadId',
  component: () => {
    const { threadId } = bbsDetailRoute.useParams();
    return (
      <div className="animate-in fade-in duration-700">
        <ThreadDetail threadId={threadId} />
      </div>
    );
  },
});
