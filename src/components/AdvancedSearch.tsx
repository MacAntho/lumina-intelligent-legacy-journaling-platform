import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, History, Star, Bookmark, Calendar, ImageIcon, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { JOURNAL_TEMPLATES } from '@shared/templates';
import { cn } from '@/lib/utils';
import type { SearchFilters } from '@shared/types';
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
  const clearRecentSearches = useAppStore(s => s.clearRecentSearches);
  const savedSearches = useAppStore(s => s.savedSearches);
  const saveSearch = useAppStore(s => s.saveSearch);
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Simple fuzzy search + filter logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Text Search
      const searchStr = query.toLowerCase();
      const matchesText = !query || searchFields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(searchStr);
      });
      if (!matchesText) return false;
      // 2. Metadata Filters
      if (filters.moods?.length && !filters.moods.includes(item.mood)) return false;
      if (filters.templateIds?.length && !filters.templateIds.includes(item.templateId)) return false;
      if (filters.hasImages && (!item.images || item.images.length === 0)) return false;
      if (filters.minWordCount && (item.wordCount || 0) < filters.minWordCount) return false;
      if (filters.tags?.length && !filters.tags.some(t => item.tags?.includes(t))) return false;
      if (filters.dateRange) {
        const itemDate = new Date(item.date || item.createdAt).getTime();
        const start = new Date(filters.dateRange.start).getTime();
        const end = new Date(filters.dateRange.end).getTime();
        if (itemDate < start || itemDate > end) return false;
      }
      return true;
    });
  }, [items, query, filters, searchFields]);
  useEffect(() => {
    onResults(filteredItems);
  }, [filteredItems, onResults]);
  const handleApplySaved = (saved: any) => {
    setQuery(saved.query);
    setFilters(saved.filters);
    setIsDropdownOpen(false);
  };
  const handleSaveCurrent = () => {
    const name = query || 'Custom Search';
    saveSearch({ name, query, filters });
  };
  const toggleFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => {
      const current = (prev[key] as any[]) || [];
      const next = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };
  return (
    <div className="w-full space-y-4">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
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
            {isDropdownOpen && (recentSearches.length > 0 || savedSearches.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                {savedSearches.length > 0 && (
                  <div className="p-2 border-b border-stone-50">
                    <p className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Saved Patterns</p>
                    {savedSearches.map(s => (
                      <button key={s.id} onClick={() => handleApplySaved(s)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-50 text-sm transition-colors">
                        <Bookmark size={14} className="text-amber-500" />
                        <span className="flex-1 text-left">{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {recentSearches.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-3 py-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Recent</p>
                      <button onClick={clearRecentSearches} className="text-[10px] text-stone-300 hover:text-stone-600">Clear</button>
                    </div>
                    {recentSearches.map(q => (
                      <button key={q} onClick={() => setQuery(q)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-50 text-sm transition-colors">
                        <History size={14} className="text-stone-300" />
                        <span className="flex-1 text-left">{q}</span>
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
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 flex items-center gap-2">
                  <Sparkles size={12} /> Emotional Map
                </Label>
                <div className="flex flex-wrap gap-2">
                  {['High', 'Normal', 'Low', 'Inspired', 'Tired'].map(m => (
                    <Badge 
                      key={m}
                      variant={filters.moods?.includes(m) ? 'default' : 'outline'}
                      className="cursor-pointer rounded-full px-3 py-1 text-[10px]"
                      onClick={() => toggleFilter('moods', m)}
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 flex items-center gap-2">
                  <Type size={12} /> Writing Depth
                </Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-600">Deep Dives (&gt; 250 words)</span>
                    <Checkbox 
                      checked={filters.minWordCount === 250} 
                      onCheckedChange={(v) => setFilters(f => ({ ...f, minWordCount: v ? 250 : 0 }))} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-600">Visual Memories</span>
                    <Checkbox 
                      checked={!!filters.hasImages} 
                      onCheckedChange={(v) => setFilters(f => ({ ...f, hasImages: !!v }))} 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 flex items-center gap-2">
                  <Calendar size={12} /> Discovery Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="date" 
                    className="h-8 text-[10px] rounded-lg border-stone-200"
                    onChange={(e) => setFilters(f => ({ ...f, dateRange: { ...f.dateRange!, start: e.target.value } }))}
                  />
                  <Input 
                    type="date" 
                    className="h-8 text-[10px] rounded-lg border-stone-200"
                    onChange={(e) => setFilters(f => ({ ...f, dateRange: { ...f.dateRange!, end: e.target.value } }))}
                  />
                </div>
                <Button variant="ghost" className="w-full text-[10px] uppercase font-bold h-8" onClick={() => setFilters({})}>Reset Filters</Button>
              </div>
              <div className="md:col-span-3 pt-4 border-t border-stone-200 flex justify-between items-center">
                <span className="text-xs text-stone-400 font-serif italic">
                  {filteredItems.length} matching reflections found in your sanctuary.
                </span>
                <Button size="sm" onClick={handleSaveCurrent} className="rounded-full bg-stone-900 text-white text-[10px] h-8 px-4">
                  <Star size={12} className="mr-2" /> Save this Pattern
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}