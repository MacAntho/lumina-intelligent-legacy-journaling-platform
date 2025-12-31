import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { Dashboard } from '@/pages/Dashboard'
import { JournalDetail } from '@/pages/JournalDetail'
import { Insights } from '@/pages/Insights'
import { LegacySettings } from '@/pages/LegacySettings'
import { AuthPage } from '@/pages/AuthPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AIChat } from '@/pages/AIChat'
import { SettingsPage } from '@/pages/SettingsPage'
import { LegacyView } from '@/pages/LegacyView'
import { ActivityPage } from '@/pages/ActivityPage'
import { AuthGuard } from '@/components/AuthGuard'
// PWA Registration & Permissions
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length === 0) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Lumina PWA: ServiceWorker registered with scope: ', registration.scope);
        }).catch(err => {
          console.log('Lumina PWA: ServiceWorker registration failed: ', err);
        });
      }
    });
  });
}
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard",
    element: <AuthGuard><Dashboard /></AuthGuard>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/journal/:id",
    element: <AuthGuard><JournalDetail /></AuthGuard>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/insights",
    element: <AuthGuard><Insights /></AuthGuard>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/legacy",
    element: <AuthGuard><LegacySettings /></AuthGuard>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/activity",
    element: <AuthGuard><ActivityPage /></AuthGuard>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/profile",
    element: <AuthGuard><ProfilePage /></AuthGuard>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/ai-assistant",
    element: <AuthGuard><AIChat /></AuthGuard>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: <AuthGuard><SettingsPage /></AuthGuard>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/shared/:shareId",
    element: <LegacyView />,
    errorElement: <RouteErrorBoundary />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)