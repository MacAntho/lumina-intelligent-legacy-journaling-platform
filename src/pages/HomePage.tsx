import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, BookOpen, ShieldCheck, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
export function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 selection:bg-stone-200">
      <ThemeToggle />
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-stone-900 flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <span className="text-2xl font-bold tracking-tighter">Lumina</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-stone-500">
          <a href="#features" className="hover:text-stone-900 transition-colors">Features</a>
          <a href="#legacy" className="hover:text-stone-900 transition-colors">Legacy</a>
          <a href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</a>
        </div>
        <Button asChild variant="outline" className="rounded-full border-stone-200">
          <Link to="/dashboard">Log In</Link>
        </Button>
      </nav>
      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight text-stone-900 leading-none">
              Write today. <br />
              <span className="italic text-stone-400">Reflect intelligently.</span>
            </h1>
            <p className="text-xl text-stone-500 max-w-2xl mx-auto font-light leading-relaxed">
              Lumina is a minimalist sanctuary for your thoughts, enhanced by AI to uncover patterns in your growth and preserve your legacy.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg bg-stone-900 text-white hover:bg-stone-800 shadow-xl shadow-stone-200">
                <Link to="/dashboard">
                  Start Writing <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="rounded-full px-8 py-6 text-lg text-stone-600">
                See how it works
              </Button>
            </div>
          </motion.div>
        </section>
        {/* Feature Grid */}
        <section id="features" className="bg-stone-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4 p-8 rounded-3xl bg-white border border-stone-100 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-semibold">Structured Journaling</h3>
                <p className="text-stone-500 font-light">
                  Templates designed for clarity, from gratitude practices to high-performance fitness tracking.
                </p>
              </div>
              <div className="space-y-4 p-8 rounded-3xl bg-white border border-stone-100 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-semibold">AI Pattern Sensing</h3>
                <p className="text-stone-500 font-light">
                  Our intelligence layer subtly identifies mood shifts and recurring topics without intruding on your space.
                </p>
              </div>
              <div className="space-y-4 p-8 rounded-3xl bg-white border border-stone-100 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-stone-100 text-stone-900 flex items-center justify-center">
                  <HeartPulse size={24} />
                </div>
                <h3 className="text-xl font-semibold">Legacy Transmission</h3>
                <p className="text-stone-500 font-light">
                  Securely share your life's wisdom with loved ones through scheduled or inactivity-triggered release.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-12 border-t border-stone-100 text-center text-stone-400 text-sm">
        <p>&copy; 2024 Lumina Journaling Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}