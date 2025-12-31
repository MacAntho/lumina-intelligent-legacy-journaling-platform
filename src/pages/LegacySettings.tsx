import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Heart, UserPlus, Trash2, Mail, ShieldCheck, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { LegacyShare } from '@shared/types';
export function LegacySettings() {
  const journals = useAppStore(s => s.journals);
  const legacyContacts = useAppStore((s) => s.legacyContacts);
  const addLegacyContact = useAppStore((s) => s.addLegacyContact);
  const removeLegacyContact = useAppStore((s) => s.removeLegacyContact);
  const isSaving = useAppStore((s) => s.isSaving);
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const handleAddContact = async () => {
    if (!newName || !newEmail) return;
    await addLegacyContact({ name: newName, email: newEmail });
    setNewName('');
    setNewEmail('');
    toast.success('Recipient added and verification email sent.');
  };
  const handleGenerateLink = async (journalId: string) => {
    setGeneratingFor(journalId);
    try {
      const data = await api<LegacyShare>('/api/legacy/generate-link', {
        method: 'POST',
        body: JSON.stringify({ 
          journalId, 
          recipientEmail: legacyContacts[0]?.email || 'legacy@lumina.io' 
        })
      });
      const link = `${window.location.origin}/shared/${data.id}?key=${data.accessKey}`;
      setShareLinks(prev => ({ ...prev, [journalId]: link }));
      toast.success('Legacy link generated');
    } catch (error) {
      toast.error('Failed to generate sharing link');
    } finally {
      setGeneratingFor(null);
    }
  };
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-12">
        <header>
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <Heart size={20} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Legacy Protection</span>
          </div>
          <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">Transmission Plan</h1>
          <p className="text-stone-500 mt-2 font-light">
            Decide who receives your journals and what triggers the delivery. Your legacy, handled with care.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <UserPlus size={18} /> Trusted Recipients
              </CardTitle>
              <CardDescription>People who will receive your legacy content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 min-h-[100px]">
                {legacyContacts.length === 0 ? (
                  <p className="text-sm text-stone-400 italic text-center py-6">No recipients added yet.</p>
                ) : (
                  legacyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-medium">
                          {contact.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{contact.name}</p>
                          <p className="text-xs text-stone-500">{contact.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {contact.status === 'verified' ? (
                          <ShieldCheck size={16} className="text-emerald-500" />
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-stone-400">Pending</span>
                        )}
                        <button onClick={() => removeLegacyContact(contact.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="rounded-xl" />
                </div>
                <Button onClick={handleAddContact} className="w-full rounded-xl bg-stone-900 text-white" disabled={!newName || !newEmail || isSaving}>
                  {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
                  Add Recipient
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-8">
            <Card className="rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <Clock size={18} /> Delivery Trigger
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Inactivity Timer</p>
                    <p className="text-xs text-stone-500">Deliver if you haven't logged in for 6 months.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between opacity-50">
                  <div className="space-y-1">
                    <p className="font-medium">Scheduled Release</p>
                    <p className="text-xs text-stone-500">Deliver on a specific future date.</p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <ShieldCheck size={18} /> Share Journals
                </CardTitle>
                <CardDescription>Manually generate links for specific journals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {journals.map(j => (
                  <div key={j.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{j.title}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={generatingFor === j.id}
                        onClick={() => handleGenerateLink(j.id)}
                        className="rounded-full text-xs"
                      >
                        {generatingFor === j.id ? <Loader2 className="animate-spin h-3 w-3" /> : 'Generate Link'}
                      </Button>
                    </div>
                    {shareLinks[j.id] && (
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={shareLinks[j.id]}
                          className="text-[10px] bg-white border rounded px-2 py-1 flex-1 truncate"
                        />
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => {
                          navigator.clipboard.writeText(shareLinks[j.id]);
                          toast.success('Link copied');
                        }}>Copy</Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <Mail size={18} /> Final Message
                </CardTitle>
                <CardDescription>The note sent along with your shared journals.</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[120px] bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-4 text-sm font-light border-none focus:ring-1 focus:ring-stone-400 outline-none resize-none"
                  placeholder="Share a final thought or instruction..."
                  defaultValue="This journal contains my reflections and memories that I'd like you to have. I hope these words bring you comfort and clarity."
                />
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full rounded-xl">Save Message</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}