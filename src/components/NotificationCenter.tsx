import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, Trash2, Shield, Share2, FileDown,
  Sparkles, MessageCircle, AlertCircle, Info, Zap, Loader2
} from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
export function NotificationCenter() {
  const notifications = useAppStore(s => s.notifications);
  const unreadCount = useAppStore(s => s.unreadCount);
  const markRead = useAppStore(s => s.markNotificationRead);
  const markAllRead = useAppStore(s => s.markAllNotificationsRead);
  const deleteNote = useAppStore(s => s.deleteNotification);
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const getIcon = (type: string) => {
    switch (type) {
      case 'access': return <Shield className="size-4 text-rose-500" />;
      case 'share': return <Share2 className="size-4 text-blue-500" />;
      case 'export': return <FileDown className="size-4 text-emerald-500" />;
      case 'insight': return <Sparkles className="size-4 text-amber-500" />;
      case 'prompt': return <MessageCircle className="size-4 text-stone-500" />;
      case 'limit': return <AlertCircle className="size-4 text-red-500" />;
      case 'affirmation': return <Zap className="size-4 text-amber-400" />;
      default: return <Info className="size-4 text-stone-400" />;
    }
  };
  const handleNotificationClick = (n: any) => {
    markRead(n.id);
    if (n.link) {
      navigate(n.link);
      setPopoverOpen(false);
    }
  };
  const handleClearAll = async () => {
    await markAllRead();
    setConfirmClearOpen(false);
    toast.success('All notifications archived.');
  };
  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative hover:bg-stone-100 rounded-full transition-all">
            <Bell className="size-5 text-stone-600" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge className="h-4 w-4 flex items-center justify-center p-0 bg-stone-900 border-white border-2 text-[8px] shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                  <div className="absolute inset-0 rounded-full bg-stone-900 animate-ping opacity-30" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 rounded-3xl shadow-2xl border-stone-100 mr-4 overflow-hidden" align="end">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50 bg-white">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Transmissions</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-[10px] text-stone-400 hover:text-stone-900"
                onClick={() => setConfirmClearOpen(true)}
              >
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="h-[400px] bg-white">
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-30 px-6">
                    <div className="h-14 w-14 rounded-3xl bg-stone-50 flex items-center justify-center">
                      <Zap className="size-6 text-stone-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-serif italic">Your sky is clear.</p>
                      <p className="text-[10px] uppercase font-bold tracking-widest">No Active Alerts</p>
                    </div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "group relative flex gap-4 p-5 border-b border-stone-50 transition-all hover:bg-stone-50/50 cursor-pointer",
                        !n.isRead && "bg-stone-50/30"
                      )}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="shrink-0 mt-1 p-2 rounded-xl bg-white shadow-sm border border-stone-100 group-hover:scale-110 transition-transform">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1.5 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("text-xs font-medium truncate font-serif", !n.isRead ? "text-stone-900" : "text-stone-500")}>
                            {n.title}
                          </p>
                          <span className="text-[8px] font-bold text-stone-300 shrink-0 uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: false })}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2 font-light">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-4 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                            className="text-[9px] font-bold text-stone-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                      {!n.isRead && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-stone-900 shadow-sm" />
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
          <div className="p-2 border-t border-stone-50 bg-stone-50/50">
            <Button
              variant="ghost"
              className="w-full h-10 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] hover:bg-white hover:text-stone-900 transition-all rounded-2xl"
              onClick={() => { navigate('/activity'); setPopoverOpen(false); }}
            >
              Universal Timeline
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent className="rounded-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Bulk Archive Transmissions?</AlertDialogTitle>
            <AlertDialogDescription>
              All pending notifications will be marked as read. You can still view them in the activity hub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="rounded-xl bg-stone-900 text-white">
              Archive All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}