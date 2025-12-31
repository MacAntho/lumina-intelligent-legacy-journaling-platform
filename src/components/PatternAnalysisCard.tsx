import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Sparkles, TrendingUp, Target, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { AiInsight } from '@shared/types';
import { cn } from '@/lib/utils';
interface PatternAnalysisCardProps {
  insight: AiInsight;
}
export function PatternAnalysisCard({ insight }: PatternAnalysisCardProps) {
  const paragraphs = insight.content.split('\n\n');
  const copyToClipboard = () => {
    navigator.clipboard.writeText(insight.content);
    toast.success("Intelligence narrative copied to clipboard.");
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <Card className="rounded-4xl border-none bg-white shadow-2xl overflow-hidden">
        <div className="p-10 md:p-16 space-y-12">
          <header className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkles size={16} />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">The Lumina Chronicler</span>
              </div>
              <h2 className="text-3xl font-serif text-stone-900">Personal Growth Narrative</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={copyToClipboard} className="rounded-full h-10 w-10">
              <Copy size={18} className="text-stone-400" />
            </Button>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3 space-y-8">
              {paragraphs.map((para, i) => (
                <motion.p
                  key={i}
                  variants={itemVariants}
                  className={cn(
                    "text-lg md:text-xl font-serif leading-relaxed text-stone-800",
                    i === 0 && "first-letter:text-5xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:text-stone-900"
                  )}
                >
                  {para}
                </motion.p>
              ))}
            </div>
            <aside className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                  <TrendingUp size={14} /> Emerging Themes
                </label>
                <div className="flex flex-wrap gap-2">
                  {insight.topThemes.map(t => (
                    <span key={t} className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-medium uppercase tracking-wider">{t}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                  <Target size={14} /> Focus Areas
                </label>
                <div className="space-y-3">
                  {insight.goalsIdentified.map((g, i) => (
                    <div key={i} className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-900 font-serif italic">
                      "{g}"
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                  <RefreshCw size={14} /> Growth Signals
                </label>
                <ul className="space-y-2">
                  {insight.growthIndicators.map((g, i) => (
                    <li key={i} className="text-xs text-stone-500 font-light leading-relaxed flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
        <div className="bg-stone-900 px-10 py-4 text-center">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-[0.5em]">Reflection Deep-Dive • Security Layer AES-256</span>
        </div>
      </Card>
    </motion.div>
  );
}