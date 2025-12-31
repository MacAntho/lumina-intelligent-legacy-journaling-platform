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
import { Settings, Moon, Globe, Bell, Shield, Download, Trash2, Loader2, Sparkles, Share2, FileDown, RefreshCw, GraduationCap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
export function SettingsPage() {
  const user = useAppStore(s => s.user);
  const isSaving = useAppStore(s => s.isSaving);
  const journals = useAppStore(s => s.journals);
  const entries = useAppStore(s => s.entries);
  const updateProfile = useAppStore(s => s.updateProfile);
  const restartTour = useAppStore(s => s.restartTour);
  const deleteAccount = useAppStore(s => s.deleteAccount);
  const navigate = useNavigate();
  const handlePreferenceChange = async (key: string, value: any) => {
    if (!user) return;
    const newPrefs = { ...user.preferences, [key]: value };
    await updateProfile(newPrefs);
  };
  const handleNotificationTypeToggle = async (type: string, value: boolean) => {
    if (!user) return;
    const newSettings = { ...user.preferences.notificationSettings, [type]: value };
    await handlePreferenceChange('notificationSettings', newSettings);
  };
  const handleRestartTour = async () => {
    await restartTour();
    navigate('/dashboard');
    toast.success('Onboarding tour restarted.');
  };
  const handleExportFullSanctuary = () => {
    const data = {
      profile: user,
      journals,
      entries,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumina-sanctuary-export-${dateFnsFormat(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    toast.success('Sanctuary archive successfully compiled.');
  };
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
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
            <p className="text-stone-500 mt-2 font-light">Customize your sanctuary's environment and security.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-300">
            {isSaving ? (
              <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Syncing...</span>
            ) : (
              <span className="flex items-center gap-2 text-emerald-500">All Changes Safe</span>
            )}
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Moon size={18} /> Appearance</CardTitle>
                <CardDescription>Visual preferences for your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-select">Interface Theme</Label>
                  <Select
                    defaultValue={user?.preferences?.theme || 'system'}
                    onValueChange={(val) => handlePreferenceChange('theme', val)}
                  >
                    <SelectTrigger id="theme-select" className="w-32 rounded-xl">
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
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><GraduationCap size={18} /> Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleRestartTour} className="w-full justify-start gap-2 rounded-xl">
                  <RefreshCw size={16} /> Restart Guided Tour
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Bell size={18} /> Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>Global Alerts</Label>
                  <Switch
                    checked={user?.preferences?.notificationsEnabled}
                    onCheckedChange={(val) => handlePreferenceChange('notificationsEnabled', val)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-rose-100 shadow-sm bg-rose-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-rose-900"><Shield size={18} /> Danger Zone</CardTitle>
                <CardDescription>Irreversible data operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" onClick={handleExportFullSanctuary} className="w-full justify-start gap-2 rounded-xl border-stone-200 hover:bg-stone-50">
                  <Download size={16} /> Export All Data (.json)
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-rose-600 border-rose-100 hover:bg-rose-50">
                      <Trash2 size={16} /> Permanent Account Purge
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-4xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-serif">Absolute Purge Confirmation</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently erase your profile, all journals, and every legacy transmission. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Retain Sanctuary</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="rounded-xl bg-rose-600 text-white">Purge Everything</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
              <CardFooter>
                <p className="text-[10px] text-stone-400 italic">Data is encrypted at rest and purged immediately upon request.</p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
const dateFnsFormat = (date: Date, fmt: string) => {
  return date.toISOString().split('T')[0]; // Simple fallback for filename
}