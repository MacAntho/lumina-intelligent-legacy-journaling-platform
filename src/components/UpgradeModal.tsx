import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}
export function UpgradeModal({ open, onOpenChange, title, description }: UpgradeModalProps) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-4xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-stone-900 p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-900/20">
            <Sparkles size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-serif text-white">{title}</h2>
            <p className="text-stone-400 text-sm font-light px-4">{description}</p>
          </div>
        </div>
        <div className="p-8 bg-white space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Premium Benefits</p>
            <div className="grid grid-cols-1 gap-2">
              {['Unlimited Sanctuaries', 'Unlimited Reflections', 'Advanced AI Pattern Analysis', 'Priority Legacy Transmission'].map(b => (
                <div key={b} className="flex items-center gap-3 text-sm text-stone-600">
                  <div className="h-4 w-4 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Check size={10} className="text-emerald-600" />
                  </div>
                  {b}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <Button 
              onClick={() => { onOpenChange(false); navigate('/pricing'); }}
              className="w-full h-14 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 transition-all font-medium"
            >
              Unlock Limitless Reflections <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="w-full mt-2 text-stone-400 text-xs hover:text-stone-900"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}