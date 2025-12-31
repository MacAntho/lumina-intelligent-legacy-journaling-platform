import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Heart, UserPlus, Trash2, Mail, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
export function LegacySettings() {
  const legacyContacts = useAppStore((s) => s.legacyContacts);
  const addLegacyContact = useAppStore((s) => s.addLegacyContact);
  const removeLegacyContact = useAppStore((s) => s.removeLegacyContact);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const handleAddContact = () => {
    if (!newName || !newEmail) return;
    addLegacyContact({ name: newName, email: newEmail });
    setNewName('');
    setNewEmail('');
    toast.success('Recipient added and verification email sent.');
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
              <div className="space-y-4">
                {legacyContacts.map((contact) => (
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
                ))}
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
                <Button onClick={handleAddContact} className="w-full rounded-xl bg-stone-900 text-white" disabled={!newName || !newEmail}>
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