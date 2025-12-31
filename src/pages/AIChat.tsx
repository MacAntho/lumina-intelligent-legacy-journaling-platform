import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Trash2, Bot, User, BrainCircuit, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
export function AIChat() {
  const history = useAppStore(s => s.aiChatHistory);
  const sendAiMessage = useAppStore(s => s.sendAiMessage);
  const clearChatHistory = useAppStore(s => s.clearChatHistory);
  const isSaving = useAppStore(s => s.isSaving);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);
  const handleSend = async () => {
    if (!input.trim() || isSaving) return;
    const msg = input;
    setInput('');
    await sendAiMessage(msg);
  };
  const quickPrompts = [
    "Summarize my week",
    "Analyze my mood patterns",
    "Identify recurring themes",
    "Suggest a writing prompt"
  ];
  return (
    <AppLayout container>
      <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Sparkles size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Intelligence Layer</span>
            </div>
            <h1 className="text-3xl font-serif font-medium text-stone-900">Empathetic Guide</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChatHistory} className="text-stone-400 hover:text-red-500">
            <Trash2 size={16} className="mr-2" /> Reset Conversation
          </Button>
        </header>
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-hide"
        >
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
              <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <BrainCircuit size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif">Deepen your reflection</h3>
                <p className="text-stone-500 max-w-sm font-light">
                  Ask me about your writing habits, recurring themes, or for a summary of your recent growth.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {quickPrompts.map(p => (
                  <Button key={p} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setInput(p)}>
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {history.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex w-full gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-stone-900 text-white" : "bg-amber-100 text-amber-700"
                  )}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-stone-900 text-stone-100 rounded-tr-none" 
                      : "bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm"
                  )}>
                    {msg.content}
                    <div className={cn(
                      "text-[10px] mt-2 opacity-40",
                      msg.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {format(new Date(msg.timestamp), 'h:mm a')}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isSaving && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="bg-white border border-stone-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm italic text-stone-400 text-sm">
                    Lumina is reflecting...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-stone-100">
          <div className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-2 focus-within:ring-2 focus-within:ring-stone-200 transition-all shadow-sm">
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your legacy or growth..."
              className="border-none focus-visible:ring-0 min-h-[50px] max-h-[150px] bg-transparent resize-none p-2 text-sm"
            />
            <div className="flex justify-between items-center px-2 pb-1">
              <span className="text-[10px] text-stone-400 italic">
                Processed privately on Lumina Cloud
              </span>
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isSaving}
                className="h-8 w-8 rounded-lg bg-stone-900 text-white p-0 hover:scale-105 transition-transform"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}