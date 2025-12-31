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
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history, isSaving]);
  const handleSend = async () => {
    if (!input.trim() || isSaving) return;
    const msg = input;
    setInput('');
    await sendAiMessage(msg);
  };
  const quickPrompts = [
    "Summarize my recent journey",
    "What are my mood patterns?",
    "Identify recurring themes",
    "Give me a writing prompt"
  ];
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-14rem)] bg-white/50 backdrop-blur-sm rounded-4xl border border-stone-100 shadow-xl overflow-hidden">
        <header className="p-6 border-b border-stone-100 flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
              <BrainCircuit size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-medium text-stone-900">Empathetic Guide</h1>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[8px] h-4">INTELLIGENCE V2</Badge>
              </div>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Encrypted Reflection Tunnel</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChatHistory} className="text-stone-400 hover:text-red-500 rounded-xl h-9">
            <Trash2 size={16} className="mr-2" /> Clear History
          </Button>
        </header>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
        >
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-3xl font-serif text-stone-900">How shall we reflect today?</h3>
                <p className="text-stone-500 max-w-sm font-light leading-relaxed mx-auto">
                  I've analyzed your recent archives. Ask me to uncover patterns or summarize your progress.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {quickPrompts.map(p => (
                  <Button 
                    key={p} 
                    variant="outline" 
                    className="rounded-2xl text-xs h-12 border-stone-200 hover:border-stone-400 hover:bg-stone-50 justify-start px-4 font-serif italic" 
                    onClick={() => setInput(p)}
                  >
                    "{p}"
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {history.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex w-full gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === 'user' ? "bg-stone-900 text-white" : "bg-white border border-stone-100 text-amber-600"
                  )}>
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className={cn(
                    "max-w-[75%] px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                    msg.role === 'user'
                      ? "bg-stone-900 text-stone-100 rounded-tr-none font-sans"
                      : "bg-white border border-stone-100 text-stone-800 rounded-tl-none font-serif text-base"
                  )}>
                    {msg.content}
                    <div className={cn(
                      "text-[9px] mt-3 opacity-30 font-bold uppercase tracking-widest",
                      msg.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {format(new Date(msg.timestamp), 'h:mm a')}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isSaving && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-amber-600 shadow-sm">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                  <div className="bg-white border border-stone-100 px-6 py-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <span className="text-stone-400 text-sm font-serif italic">Lumina is reflecting</span>
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1 h-1 bg-amber-500 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1 h-1 bg-amber-500 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1 h-1 bg-amber-500 rounded-full" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
        <footer className="p-6 bg-white/80 border-t border-stone-100">
          <div className="relative max-w-3xl mx-auto flex items-end gap-3">
            <div className="relative flex-1 bg-stone-50 rounded-3xl border border-stone-200 focus-within:ring-2 focus-within:ring-stone-200 transition-all p-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me about your legacy..."
                className="border-none focus-visible:ring-0 min-h-[44px] max-h-[120px] bg-transparent resize-none px-4 py-3 text-sm font-serif"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSaving}
              className="h-14 w-14 rounded-3xl bg-stone-900 text-white hover:scale-105 transition-transform shrink-0 shadow-lg shadow-stone-200"
            >
              <Send size={20} />
            </Button>
          </div>
          <div className="text-center mt-4">
            <span className="text-[10px] text-stone-300 font-bold uppercase tracking-[0.3em]">
              Edge-Processed Intelligence
            </span>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}