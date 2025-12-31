import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Moon, Globe, Bell, Shield, Download, Trash2, Loader2, Sparkles, Share2, FileDown } from 'lucide-react';
import { toast } from 'sonner';
export function SettingsPage() {
  const user = useAppStore(s => s.user);
  const isSaving = useAppStore(s => s.isSaving);
  const updateProfile = useAppStore(s => s.updateProfile);
  const handlePreferenceChange = async (key: string, value: any) => {
    if (!user) return;
    const newPrefs = { ...user.preferences, [key]: value };
    await updateProfile({ preferences: newPrefs });
    toast.success('Preferences updated');
  };
  const handleNotificationTypeToggle = async (type: string, value: boolean) => {
    if (!user) return;
    const newSettings = { ...user.preferences.notificationSettings, [type]: value };
    await handlePreferenceChange('notificationSettings', newSettings);
  };
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <header>
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Settings size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Application Control</span>
          </div>
          <h1 className="text-4xl font-serif font-medium text-stone-900">Settings</h1>
          <p className="text-stone-500 mt-2 font-light">Customize your sanctuary's environment and security.</p>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="lang-select">Language</Label>
                  <Select
                    defaultValue={user?.preferences?.language || 'en'}
                    onValueChange={(val) => handlePreferenceChange('language', val)}
                  >
                    <SelectTrigger id="lang-select" className="w-32 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Bell size={18} /> Notification Controls</CardTitle>
                <CardDescription>Configure how and when you want to be notified.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Master Alerts</Label>
                    <p className="text-xs text-stone-500">Enable all in-app notifications.</p>
                  </div>
                  <Switch
                    checked={user?.preferences?.notificationsEnabled}
                    onCheckedChange={(val) => handlePreferenceChange('notificationsEnabled', val)}
                  />
                </div>
                <div className="pt-4 border-t border-stone-100 space-y-4">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Granular Toggles</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Share2 size={14} className="text-stone-400" />
                        <span>Legacy Share Creation</span>
                      </div>
                      <Switch 
                        size="sm" 
                        checked={user?.preferences?.notificationSettings?.share} 
                        onCheckedChange={(v) => handleNotificationTypeToggle('share', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Shield size={14} className="text-stone-400" />
                        <span>Legacy Access Alerts</span>
                      </div>
                      <Switch 
                        size="sm" 
                        checked={user?.preferences?.notificationSettings?.access} 
                        onCheckedChange={(v) => handleNotificationTypeToggle('access', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Sparkles size={14} className="text-stone-400" />
                        <span>AI Insights & Prompts</span>
                      </div>
                      <Switch 
                        size="sm" 
                        checked={user?.preferences?.notificationSettings?.insight} 
                        onCheckedChange={(v) => handleNotificationTypeToggle('insight', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <FileDown size={14} className="text-stone-400" />
                        <span>Export Completions</span>
                      </div>
                      <Switch 
                        size="sm" 
                        checked={user?.preferences?.notificationSettings?.export} 
                        onCheckedChange={(v) => handleNotificationTypeToggle('export', v)}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-stone-100 space-y-3">
                   <div className="flex items-center justify-between">
                    <Label className="text-xs">Quiet Hours</Label>
                    <Switch 
                      size="sm" 
                      checked={user?.preferences?.quietHours?.enabled}
                      onCheckedChange={(v) => handlePreferenceChange('quietHours', { ...user?.preferences?.quietHours, enabled: v })}
                    />
                  </div>
                  {user?.preferences?.quietHours?.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <Select 
                        value={user?.preferences?.quietHours?.start}
                        onValueChange={(v) => handlePreferenceChange('quietHours', { ...user?.preferences?.quietHours, start: v })}
                      >
                        <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder="Start" /></SelectTrigger>
                        <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select 
                        value={user?.preferences?.quietHours?.end}
                        onValueChange={(v) => handlePreferenceChange('quietHours', { ...user?.preferences?.quietHours, end: v })}
                      >
                        <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder="End" /></SelectTrigger>
                        <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="rounded-3xl border-stone-200 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Shield size={18} /> Privacy & Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl">
                  <Download size={16} /> Export All Journals (.json)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 size={16} /> Delete Account Permanently
                </Button>
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-[10px] text-stone-400 italic">Lumina encrypts all entries before storage in the Global Durable Object.</p>
              </CardFooter>
            </Card>
            {isSaving && (
              <div className="flex items-center justify-center p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <Loader2 className="animate-spin text-stone-400 mr-2 h-4 w-4" />
                <span className="text-xs text-stone-500 font-serif">Synchronizing with cloud...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}