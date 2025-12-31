import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const isLoading = useAppStore(s => s.isLoading);
  const token = useAppStore(s => s.token);
  const initialize = useAppStore(s => s.initialize);
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) {
      navigate('/auth');
    } else if (!isAuthenticated && !isLoading) {
      initialize();
    }
  }, [isAuthenticated, isLoading, token, navigate, initialize]);
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FDFCFB] space-y-4">
        <Loader2 className="animate-spin text-stone-900 h-10 w-10" />
        <p className="text-stone-500 font-serif italic">Entering your sanctuary...</p>
      </div>
    );
  }
  if (!isAuthenticated && !token) {
    return null;
  }
  return <>{children}</>;
}