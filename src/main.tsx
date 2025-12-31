import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Loader2 } from 'lucide-react';
import '@/index.css'
// Optimized Code Splitting for Production
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const JournalDetail = lazy(() => import('@/pages/JournalDetail').then(m => ({ default: m.JournalDetail })));
const Insights = lazy(() => import('@/pages/Insights').then(m => ({ default: m.Insights })));
const LegacySettings = lazy(() => import('@/pages/LegacySettings').then(m => ({ default: m.LegacySettings })));
const AuthPage = lazy(() => import('@/pages/AuthPage').then(m => ({ default: m.AuthPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AIChat = lazy(() => import('@/pages/AIChat').then(m => ({ default: m.AIChat })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const LegacyView = lazy(() => import('@/pages/LegacyView').then(m => ({ default: m.LegacyView })));
const ActivityPage = lazy(() => import('@/pages/ActivityPage').then(m => ({ default: m.ActivityPage })));
import { AuthGuard } from '@/components/AuthGuard'
// High-polish Suspsense Fallback
const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FDFCFB] space-y-4 animate-in fade-in duration-500">
    <Loader2 className="animate-spin text-stone-900 h-10 w-10" />
    <p className="text-stone-500 font-serif italic text-sm tracking-wide">Lumina is synchronizing your sanctuary...</p>
  </div>
);
// PWA Registration with Version Refresh Trigger
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // In a real production app, we would show a toast to refresh
              console.log('Lumina Update: New version available. Refresh to apply.');
            }
          });
        }
      });
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
    path: "/pricing",
    element: <AuthGuard><PricingPage /></AuthGuard>,
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
        <Suspense fallback={<LoadingScreen />}>
          <RouterProvider router={router} />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)