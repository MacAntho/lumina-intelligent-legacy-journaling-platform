import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, X, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
const TOUR_STEPS: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to Lumina',
    description: 'A minimalist sanctuary for your thoughts and a vessel for your digital legacy.',
    position: 'center'
  },
  {
    target: '#tour-nav-dashboard',
    title: 'Your Command Center',
    description: 'Track your growth and manage your journals from the Dashboard.',
    position: 'right'
  },
  {
    target: '#tour-new-journal',
    title: 'Create a Sanctuary',
    description: 'Start a new journal using specialized templates like Gratitude or Fitness.',
    position: 'bottom'
  },
  {
    target: '#tour-daily-guidance',
    title: 'Daily Guidance',
    description: 'Let our AI prompt your reflection with timely, insightful questions.',
    position: 'bottom'
  },
  {
    target: '#tour-nav-ai',
    title: 'Empathetic Guide',
    description: 'Chat with Lumina to uncover deep patterns in your emotional landscape.',
    position: 'right'
  },
  {
    target: '#tour-nav-legacy',
    title: 'Legacy Moat',
    description: 'Configure trusted recipients and emergency handover triggers.',
    position: 'right'
  }
];
export function OnboardingTour() {
  const isTourActive = useAppStore(s => s.isTourActive);
  const currentStepIndex = useAppStore(s => s.tourStep);
  const nextTourStep = useAppStore(s => s.nextTourStep);
  const skipTour = useAppStore(s => s.skipTour);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = TOUR_STEPS[currentStepIndex];
  useLayoutEffect(() => {
    if (!isTourActive || !step) return;
    const updateRect = () => {
      if (step.target === 'body') {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(step.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isTourActive, step]);
  if (!isTourActive || !step) return null;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;
  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay with Spotlight */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto overflow-hidden">
        <svg className="h-full w-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="currentColor" mask="url(#spotlight-mask)" className="text-stone-900/80" />
        </svg>
      </div>
      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            position: 'absolute',
            ...(targetRect ? getCardPosition(targetRect, step.position) : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
          }}
          className="pointer-events-auto w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-100 dark:border-stone-800"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Sparkles size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Guided Onboarding</span>
            </div>
            <button onClick={skipTour} className="text-stone-300 hover:text-stone-900 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2 mb-6">
            <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100">{step.title}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed">
              {step.description}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === currentStepIndex ? "w-4 bg-stone-900 dark:bg-stone-100" : "w-1 bg-stone-200 dark:bg-stone-800"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="text-stone-400 text-xs hover:bg-stone-50"
              >
                Skip
              </Button>
              <Button
                size="sm"
                onClick={isLastStep ? skipTour : nextTourStep}
                className="rounded-full bg-stone-900 text-white hover:bg-stone-800 px-4 py-0 h-9"
              >
                {isLastStep ? (
                  <>Finish <Check size={14} className="ml-2" /></>
                ) : (
                  <>Next <ChevronRight size={14} className="ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
function getCardPosition(rect: DOMRect, position: TourStep['position']): React.CSSProperties {
  const margin = 20;
  const cardWidth = 384; // max-w-sm
  switch (position) {
    case 'right':
      return {
        top: rect.top,
        left: rect.right + margin
      };
    case 'bottom':
      return {
        top: rect.bottom + margin,
        left: Math.max(margin, rect.left + rect.width / 2 - cardWidth / 2)
      };
    case 'left':
      return {
        top: rect.top,
        left: rect.left - cardWidth - margin
      };
    case 'top':
      return {
        top: rect.top - margin - 200, // heuristic
        left: rect.left + rect.width / 2 - cardWidth / 2
      };
    default:
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
  }
}