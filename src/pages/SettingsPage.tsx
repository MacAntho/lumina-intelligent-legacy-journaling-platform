import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Settings, Moon, Bell, Shield, Download, Trash2, Loader2, Footprints, Database, AlertTriangle, RefreshCw, GraduationCap, Lock, Share2, CreditCard, ExternalLink, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
export function SettingsPage() {
  const user = useAppStore(s => s.user);
  const isSaving = useAppStore(s => s.isSaving);
  const journals = useAppStore(s => s.journals);
  const entries = useAppStore(s => s.entries);
  const updateProfile = useAppStore(s => s.updateProfile);
  const restartTour = useAppStore(s => s.restartTour);
  const exportAllData = useAppStore(s => s.exportAllData);
  const deleteAccount = useAppStore(s => s.deleteAccount);
  const navigate = useNavigate();
  const handlePreferenceChange = async (key: string, value: any) => {
    if (!user) return;
    const newPrefs = { ...user.preferences, [key]: value };
    // Fix: Properly wrap preferences in the User update object
    await updateProfile({ preferences: newPrefs });
  };
  const handleRequestExport = async () => {
    toast.promise(exportAllData(), {
      loading: 'Compiling all archives...',
      success: 'Sanctuary archive delivered.',
      error: 'Transmission failed.'
    });
  };
  const handleRestartTour = async () => {
    await restartTour();
    navigate('/dashboard');
    toast.success('Onboarding tour restarted.');
  };
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <header className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Settings size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Application Control</span>
            </div>
            <h1 className="text-4xl font-serif font-medium text-stone-900">Settings</h1>
            <p className="text-stone-500 mt-2 font-light">Fine-tune your sanctuary's behavior and environment.</p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-300">
            {isSaving ? (
              <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Syncing...</span>
            ) : (
              <span className="text-emerald-500">Archive Synchronized</span>
            )}
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-serif"><Moon size={18} /> Appearance</CardTitle>
                <CardDescription className="text-xs">Adjust the visual tone of your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-select" className="text-sm">Theme Mode</Label>
                  <Select
                    defaultValue={user?.preferences?.theme || 'system'}
                    onValueChange={(val) => handlePreferenceChange('theme', val)}
                  >
                    <SelectTrigger id="theme-select" className="w-32 rounded-xl text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-serif"><Lock size={18} /> Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">E2E Content Encryption</Label>
                    <p className="text-[10px] text-stone-400">Lock archives with your unique key.</p>
                  </div>
                  <Switch 
                    checked={user?.preferences?.e2eEnabled} 
                    onCheckedChange={(v) => handlePreferenceChange('e2eEnabled', v)} 
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-serif"><Footprints size={18} /> Digital Footprint</CardTitle>
                <CardDescription className="text-xs">A live audit of your digital heritage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                    <p className="text-[10px] uppercase font-bold text-stone-400">Total Archives</p>
                    <p className="text-2xl font-serif mt-1">{journals.length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                    <p className="text-[10px] uppercase font-bold text-stone-400">Reflections</p>
                    <p className="text-2xl font-serif mt-1">{entries.length}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-stone-100/50 flex items-center gap-3">
                  <Database size={16} className="text-stone-400" />
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    Your data is stored in a Global Durable Object on the Cloudflare Edge, ensuring sub-100ms access from anywhere on Earth.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-serif"><CreditCard size={18} /> Subscription & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-900 text-white">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Current Tier</p>
                    <p className="text-lg font-serif">{user?.preferences?.tier?.toUpperCase() || 'FREE'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')} className="rounded-xl h-8 text-[10px] font-bold border-stone-700 bg-transparent text-white hover:bg-stone-800">
                    Change Plan
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">Billing Cycle</span>
                    <span className="font-medium">Monthly</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">Status</span>
                    <span className="text-emerald-500 font-medium">Active</span>
                  </div>
                  <Button variant="ghost" className="w-full justify-start p-0 h-auto text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-900 transition-colors">
                    Manage Billing Portal <ExternalLink size={10} className="ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-serif"><Bell size={18} /> Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Intelligence Alerts</Label>
                  <Switch
                    checked={user?.preferences?.notificationsEnabled}
                    onCheckedChange={(val) => handlePreferenceChange('notificationsEnabled', val)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-serif"><Activity size={18} /> Usage Audit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-500">Monthly Reflections</span>
                    <span className="font-bold">{user?.usage?.monthlyEntryCount || 0} / {user?.preferences?.tier === 'free' ? '100' : 'Unlimited'}</span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-900 rounded-full" style={{ width: `${Math.min(100, ((user?.usage?.monthlyEntryCount || 0) / (user?.preferences?.tier === 'free' ? 100 : 10000)) * 100)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-serif"><GraduationCap size={18} /> Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleRestartTour} className="w-full justify-start gap-2 rounded-xl text-xs h-10 border-stone-200">
                  <RefreshCw size={14} /> Restart Guided Tour
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-rose-100 shadow-sm bg-rose-50/20 border-dashed">
              <div className="p-6 pb-2">
                <h3 className="flex items-center gap-2 text-lg font-serif text-rose-900"><AlertTriangle size={18} /> GDPR & Data Rights</h3>
              </div>
              <CardContent className="space-y-3">
                <Button variant="outline" onClick={handleRequestExport} className="w-full justify-start gap-2 rounded-xl text-xs h-10 border-stone-200 hover:bg-white">
                  <Share2 size={14} /> Request Full Data Export (.json)
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-xs h-10 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors">
                      <Trash2 size={14} /> Permanent Account Purge
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-4xl border-rose-100">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-serif text-2xl">Final Purge Confirmation</AlertDialogTitle>
                      <AlertDialogDescription className="text-stone-500">
                        This action is catastrophic and irreversible. All journals, reflections, and legacy transmissions will be permanently scrubbed from the Edge.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Retain My Sanctuary</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="rounded-xl bg-rose-600 text-white hover:bg-rose-700">
                        Purge Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
              <CardFooter>
                <p className="text-[10px] text-stone-400 italic">Encryption keys are destroyed immediately upon purge.</p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}