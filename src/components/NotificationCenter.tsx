import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, Trash2, Shield, Share2, FileDown,
  Sparkles, MessageCircle, AlertCircle, Info, Zap
} from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
export function NotificationCenter() {
  const notifications = useAppStore(s => s.notifications);
  const unreadCount = useAppStore(s => s.unreadCount);
  const markRead = useAppStore(s => s.markNotificationRead);
  const markAllRead = useAppStore(s => s.markAllNotificationsRead);
  const deleteNote = useAppStore(s => s.deleteNotification);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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
  const handleViewAll = () => {
    setOpen(false);
    navigate('/activity');
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-stone-100 rounded-full">
          <Bell className="size-5 text-stone-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-rose-500 border-white border-2 text-[8px] animate-in zoom-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border-stone-100 mr-4" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-[10px] text-stone-500 hover:text-stone-900"
              onClick={markAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
                  <div className="h-12 w-12 rounded-full bg-stone-50 flex items-center justify-center">
                    <Bell className="size-6 text-stone-300" />
                  </div>
                  <p className="text-xs font-serif italic">Your sky is clear.</p>
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
                      "group relative flex gap-3 p-4 border-b border-stone-50 transition-colors hover:bg-stone-50/50",
                      !n.isRead && "bg-stone-50/30"
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-xs font-medium truncate", !n.isRead ? "text-stone-900" : "text-stone-500")}>
                          {n.title}
                        </p>
                        <span className="text-[9px] text-stone-400 shrink-0">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-normal line-clamp-2 font-light">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-[9px] font-bold text-stone-400 hover:text-stone-900 uppercase tracking-tighter"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNote(n.id)}
                          className="text-[9px] font-bold text-stone-400 hover:text-red-500 uppercase tracking-tighter"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {!n.isRead && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-stone-900" />
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-stone-50 bg-stone-50/30">
          <Button 
            variant="ghost" 
            className="w-full h-8 text-[10px] text-stone-400 uppercase tracking-widest hover:bg-stone-100"
            onClick={handleViewAll}
          >
            View All Activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}