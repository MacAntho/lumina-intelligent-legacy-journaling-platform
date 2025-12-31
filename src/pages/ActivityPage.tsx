import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  History, Shield, FileDown, Share2,
  Sparkles, Loader2, Calendar, LayoutList, Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
interface ActivityItem {
  id: string;
  type: 'export' | 'transmission' | 'system' | 'security';
  title: string;
  message: string;
  timestamp: string;
  metadata?: any;
}
export function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await api<ActivityItem[]>('/api/activity/stream');
        setActivities(data);
      } catch (e) {
        console.error('Failed to fetch activity stream', e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);
  const filteredActivities = activities.filter(a => filter === 'all' || a.type === filter);
  const getIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="text-rose-500" size={18} />;
      case 'export': return <FileDown className="text-emerald-500" size={18} />;
      case 'transmission': return <Share2 className="text-blue-500" size={18} />;
      case 'system': return <Sparkles className="text-amber-500" size={18} />;
      default: return <History className="text-stone-400" size={18} />;
    }
  };
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <History size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Universal Timeline</span>
            </div>
            <h1 className="text-4xl font-serif font-medium text-stone-900">Activity Hub</h1>
            <p className="text-stone-500 mt-2 font-light">A chronological trail of your interactions, transmissions, and system events.</p>
          </div>
          <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
            <TabsList className="bg-stone-100 rounded-xl p-1">
              <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
              <TabsTrigger value="transmission" className="rounded-lg text-xs">Legacy</TabsTrigger>
              <TabsTrigger value="export" className="rounded-lg text-xs">Exports</TabsTrigger>
              <TabsTrigger value="system" className="rounded-lg text-xs">System</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-stone-400">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-serif italic">Synchronizing timeline...</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-stone-100 hidden md:block" />
            <div className="space-y-8">
              <AnimatePresence initial={false}>
                {filteredActivities.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-32 text-center border-2 border-dashed border-stone-100 rounded-4xl flex flex-col items-center gap-6"
                  >
                    <div className="h-20 w-20 rounded-3xl bg-stone-50 flex items-center justify-center text-stone-300">
                      <LayoutList size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-serif text-stone-900">No events found</h3>
                      <p className="text-stone-400 text-sm max-w-xs font-light italic">Your history is a blank page. Write something beautiful to fill it.</p>
                    </div>
                  </motion.div>
                ) : (
                  filteredActivities.map((activity, idx) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="relative md:pl-16 group"
                    >
                      <div className="absolute left-[22px] top-7 h-3 w-3 rounded-full bg-white border-2 border-stone-200 group-hover:border-stone-900 transition-all z-10 hidden md:block shadow-sm">
                        {idx === 0 && <div className="absolute inset-[-4px] rounded-full border border-stone-900 animate-ping opacity-20" />}
                      </div>
                      <Card
                        className={cn(
                          "rounded-3xl border-stone-100 shadow-sm transition-all overflow-hidden cursor-pointer bg-white",
                          expandedId === activity.id ? "ring-2 ring-stone-900 shadow-xl" : "hover:shadow-md hover:border-stone-200"
                        )}
                        onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex gap-5">
                              <div className="h-14 w-14 rounded-2xl bg-stone-50 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                {getIcon(activity.type)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-stone-900 font-serif text-lg">{activity.title}</h3>
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-tighter h-4 px-1 rounded-sm border-stone-200 font-bold bg-white">
                                    {activity.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-stone-500 font-light leading-snug">{activity.message}</p>
                              </div>
                            </div>
                            <div className="flex items-center md:flex-col md:items-end gap-3 text-stone-400 shrink-0">
                              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} /> {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                              </span>
                              <span className="text-[10px] opacity-60">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </span>
                              {expandedId === activity.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedId === activity.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-6 pt-6 border-t border-stone-50 space-y-4"
                              >
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Protocol</p>
                                    <p className="text-xs text-stone-900">Edge Transmission</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Data Origin</p>
                                    <p className="text-xs text-stone-900 flex items-center gap-1"><Globe size={10} /> Global Node</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Status</p>
                                    <p className="text-xs text-emerald-600 font-medium">Verified</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Encryption</p>
                                    <p className="text-xs text-stone-900">AES-256-GCM</p>
                                  </div>
                                </div>
                                {activity.metadata && (
                                  <div className="p-3 bg-stone-50 rounded-xl text-[10px] font-mono text-stone-500 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(activity.metadata, null, 2)}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}