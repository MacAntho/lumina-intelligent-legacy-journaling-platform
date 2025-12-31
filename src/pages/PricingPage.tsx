import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, ShieldCheck, Zap, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
export function PricingPage() {
  const user = useAppStore(s => s.user);
  const createCheckoutSession = useAppStore(s => s.createCheckoutSession);
  const currentTier = user?.preferences?.tier || 'free';
  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      description: 'Foundational journaling for your daily journey.',
      features: ['3 Active Sanctuaries', '100 Entries per Month', 'Basic Intelligence Patterns', '1 Legacy Recipient'],
      cta: 'Current Plan',
      variant: 'outline'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$9.99',
      description: 'Limitless reflections and deeper pattern sensing.',
      features: ['Unlimited Sanctuaries', 'Unlimited Entries', 'Priority Intelligence Links', '3 Legacy Recipients', 'E2E Encryption Support'],
      cta: 'Upgrade to Premium',
      variant: 'default',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      description: 'The ultimate vault for high-performance legacies.',
      features: ['Everything in Premium', 'Team Legacy Sharing', 'API Export Suite', 'Unlimited Recipients', 'Personalized Insight Reports'],
      cta: 'Go Pro',
      variant: 'outline'
    }
  ];
  return (
    <AppLayout container>
      <div className="space-y-16 pb-20">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold tracking-widest px-4 py-1">PRICING</Badge>
          <h1 className="text-5xl font-serif font-medium text-stone-900 tracking-tight">Expand Your Sanctuary</h1>
          <p className="text-stone-500 font-light leading-relaxed">
            Choose the depth of your legacy. Upgrade at any time to unlock the full potential of your reflections.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((t) => (
            <Card key={t.id} className={cn(
              "rounded-4xl border-stone-200 shadow-sm flex flex-col relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
              t.popular && "border-amber-200 ring-2 ring-amber-100 shadow-xl"
            )}>
              {t.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-widest">
                  MOST POPULAR
                </div>
              )}
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-serif">{t.name}</CardTitle>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-serif font-medium tracking-tight">{t.price}</span>
                  <span className="ml-1 text-stone-400 text-sm font-light">/month</span>
                </div>
                <CardDescription className="mt-4 text-xs leading-relaxed">{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 flex-1">
                <ul className="space-y-4">
                  {t.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-stone-600" />
                      </div>
                      <span className="text-sm text-stone-600 font-light">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  onClick={() => t.id !== 'free' && createCheckoutSession(t.id as any)}
                  disabled={currentTier === t.id || (t.id === 'free' && currentTier !== 'free')}
                  variant={t.variant as any} 
                  className={cn("w-full h-14 rounded-2xl font-medium transition-all", t.popular && "bg-stone-900 text-white hover:bg-stone-800")}
                >
                  {currentTier === t.id ? 'Your Sanctuary' : t.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <section className="pt-20 border-t border-stone-100">
          <h2 className="text-3xl font-serif font-medium text-center mb-12">Legacy FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h4 className="font-medium text-stone-900">Can I export my data if I cancel?</h4>
              <p className="text-sm text-stone-500 font-light leading-relaxed">Absolutely. Your thoughts are yours. You can always export your full archive in PDF or JSON format regardless of your tier status.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-stone-900">What happens if I reach my limit?</h4>
              <p className="text-sm text-stone-500 font-light leading-relaxed">You'll still be able to read and search all your past entries. To create new sanctuaries or continue writing beyond the free limit, an upgrade is required.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-stone-900">Is my data encrypted?</h4>
              <p className="text-sm text-stone-500 font-light leading-relaxed">Lumina uses industry-standard AES-256-GCM encryption for all users. Premium and Pro users can enable additional client-side E2E encryption for maximum privacy.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-stone-900">Can I share journals with my family?</h4>
              <p className="text-sm text-stone-500 font-light leading-relaxed">Yes, the Legacy feature is available to all. Pro users have access to 'Team Sharing', allowing collaborative journaling and collective legacy archives.</p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}