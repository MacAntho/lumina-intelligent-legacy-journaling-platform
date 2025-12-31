import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, History, Bookmark, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { SearchFilters } from '@shared/types';
import { format as dateFnsFormat } from 'date-fns';
import { toast } from 'sonner';
interface AdvancedSearchProps<T> {
  items: T[];
  onResults: (results: T[]) => void;
  searchFields: (keyof T)[];
  placeholder?: string;
  context?: 'global' | 'journal';
}
export function AdvancedSearch<T extends Record<string, any>>({
  items,
  onResults,
  searchFields,
  placeholder = "Search your thoughts...",
  context = 'global'
}: AdvancedSearchProps<T>) {
  const recentSearches = useAppStore(s => s.recentSearches);
  const addRecentSearch = useAppStore(s => s.addRecentSearch);
  const savedSearches = useAppStore(s => s.savedSearches);
  const saveSearch = useAppStore(s => s.saveSearch);
  const searchSuggestions = useAppStore(s => s.searchSuggestions);
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const searchStr = query.toLowerCase();
      const matchesText = !query || searchFields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(searchStr);
      });
      if (!matchesText) return false;
      if (context === 'journal') {
        const itemMood = item.mood;
        if (filters.moods?.length && itemMood && !filters.moods.includes(itemMood)) return false;
        const score = item.structuredData?.mood_score || item.structuredData?.intensity || 0;
        if (filters.minStars && score < filters.minStars) return false;
        if (filters.hasImages && (!item.images || item.images.length === 0)) return false;
        if (filters.minWordCount && (item.wordCount || 0) < filters.minWordCount) return false;
        if (filters.tags?.length) {
          const itemTags = item.tags || [];
          if (!filters.tags.some((t: string) => itemTags.includes(t))) return false;
        }
      }
      if (filters.dateRange) {
        const dateVal = item.date || item.createdAt;
        if (dateVal) {
          const itemTime = new Date(dateVal).getTime();
          if (filters.dateRange.start) {
            const startTime = new Date(filters.dateRange.start).getTime();
            if (itemTime < startTime) return false;
          }
          if (filters.dateRange.end) {
            const endTime = new Date(filters.dateRange.end).getTime();
            if (itemTime > endTime) return false;
          }
        }
      }
      return true;
    });
  }, [items, query, filters, searchFields, context]);
  const debouncedResults = useCallback(() => {
    onResults(filteredItems);
    setIsRefining(false);
  }, [filteredItems, onResults]);
  useEffect(() => {
    setIsRefining(true);
    const timer = setTimeout(debouncedResults, 150);
    return () => clearTimeout(timer);
  }, [debouncedResults]);
  const handleSaveCurrent = () => {
    const name = query || `Search ${dateFnsFormat(new Date(), 'HH:mm')}`;
    saveSearch({ name, query, filters });
    toast.success('Search pattern archived.');
  };
  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const matches = [
      ...searchSuggestions.titles.filter(t => t.toLowerCase().includes(q)).map(t => ({ text: t, type: 'title' })),
      ...searchSuggestions.tags.filter(t => t.toLowerCase().includes(q)).map(t => ({ text: t, type: 'tag' }))
    ];
    return matches.slice(0, 5);
  }, [query, searchSuggestions]);
  return (
    <div className="w-full space-y-4">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isRefining ? (
              <Loader2 className="text-stone-400 animate-spin" size={18} />
            ) : (
              <Search className="text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
            )}
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            onKeyDown={(e) => e.key === 'Enter' && addRecentSearch(query)}
            placeholder={placeholder}
            className="pl-11 pr-4 py-6 rounded-2xl border-stone-200 bg-white/50 backdrop-blur-sm focus-visible:ring-stone-200 text-lg font-serif"
          />
          <AnimatePresence>
            {isDropdownOpen && (recentSearches.length > 0 || savedSearches.length > 0 || suggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white border border-stone-100 rounded-3xl shadow-2xl z-50 overflow-hidden"
              >
                {suggestions.length > 0 && (
                  <div className="p-3 border-b border-stone-50">
                    {suggestions.map((s, idx) => (
                      <button key={idx} onClick={() => setQuery(s.text)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-50 text-sm">
                        <Sparkles size={14} className="text-amber-400" />
                        <span className="flex-1 text-left font-serif">{s.text}</span>
                      </button>
                    ))}
                  </div>
                )}
                {recentSearches.length > 0 && (
                  <div className="p-3">
                    <p className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Recent Activity</p>
                    {recentSearches.map(q => (
                      <button key={q} onClick={() => setQuery(q)} className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-stone-50 text-sm">
                        <History size={14} className="text-stone-300" />
                        <span className="flex-1 text-left text-stone-600">{q}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="h-[60px] w-[60px] rounded-2xl border-stone-200"
        >
          <SlidersHorizontal size={20} className={cn(showFilters && "text-stone-900")} />
        </Button>
      </div>
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-stone-50 border border-stone-200 rounded-4xl p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Emotional Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {['Inspired', 'Normal', 'Low'].map(m => (
                    <Badge
                      key={m}
                      variant={filters.moods?.includes(m) ? 'default' : 'outline'}
                      className="cursor-pointer rounded-full"
                      onClick={() => setFilters(f => ({ ...f, moods: f.moods?.includes(m) ? f.moods.filter(x => x !== m) : [...(f.moods || []), m] }))}
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-end gap-3">
                <Button onClick={handleSaveCurrent} className="rounded-xl h-10 text-xs gap-2 bg-stone-900 text-white">
                  <Bookmark size={14} /> Save Filter Pattern
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}