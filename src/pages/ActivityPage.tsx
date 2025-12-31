import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, Shield, FileDown, Share2, 
  Sparkles, Loader2, Calendar, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
interface ActivityItem {
  id: string;
  type: 'security' | 'export' | 'transmission' | 'system';
  title: string;
  message: string;
  timestamp: string;
  metadata?: any;
}
export function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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
              <TabsTrigger value="security" className="rounded-lg text-xs">Security</TabsTrigger>
              <TabsTrigger value="transmission" className="rounded-lg text-xs">Legacy</TabsTrigger>
              <TabsTrigger value="export" className="rounded-lg text-xs">Exports</TabsTrigger>
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
                  <div className="py-20 text-center border-2 border-dashed border-stone-100 rounded-4xl">
                    <p className="text-stone-400 font-serif italic">No recorded activity matches your filters.</p>
                  </div>
                ) : (
                  filteredActivities.map((activity, idx) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative md:pl-16 group"
                    >
                      <div className="absolute left-4 md:left-4 top-1 h-4 w-4 rounded-full bg-white border-2 border-stone-200 group-hover:border-stone-900 transition-colors z-10 hidden md:block" />
                      <Card className="rounded-3xl border-stone-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center shrink-0">
                                {getIcon(activity.type)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-stone-900">{activity.title}</h3>
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-tighter h-4 px-1 rounded-sm border-stone-200">
                                    {activity.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-stone-500 font-light">{activity.message}</p>
                              </div>
                            </div>
                            <div className="flex items-center md:flex-col md:items-end gap-2 text-stone-400">
                              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                <Calendar size={10} /> {format(new Date(activity.timestamp), 'MMM dd')}
                              </span>
                              <span className="text-[10px] opacity-60">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          {activity.metadata && (
                            <div className="mt-4 pt-4 border-t border-stone-50 flex flex-wrap gap-2">
                              {Object.entries(activity.metadata).map(([k, v]) => (
                                <div key={k} className="px-2 py-1 rounded-md bg-stone-50 text-[9px] text-stone-400 border border-stone-100">
                                  <span className="font-bold uppercase mr-1">{k}:</span> {String(v)}
                                </div>
                              ))}
                            </div>
                          )}
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