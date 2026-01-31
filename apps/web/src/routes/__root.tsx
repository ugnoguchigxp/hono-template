import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Button } from '@gxp/design-system';

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">Hono Template</h1>
            <nav className="flex space-x-4">
              <Button variant="ghost" asChild>
                <a href="/">Home</a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="/auth">Auth</a>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Welcome to Hono Template</h2>
        <p className="text-gray-600 mb-4">
          A clean architecture monorepo with Hono, React, and modern tooling.
        </p>
        <Button asChild>
          <a href="/auth">Get Started</a>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Backend</h3>
          <p className="text-gray-600 text-sm">
            Hono + TypeScript + Drizzle ORM + PostgreSQL
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Frontend</h3>
          <p className="text-gray-600 text-sm">
            React + TanStack Query/Router + gxp-design-system
          </p>
        </div>
      </div>
    </div>
  ),
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Authentication</h2>
        <p className="text-gray-600 mb-6">
          Authentication features coming soon.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" disabled>
            Register
          </Button>
          <Button variant="outline" disabled>
            Login
          </Button>
        </div>
      </div>
    </div>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute, authRoute]);

export { routeTree };
