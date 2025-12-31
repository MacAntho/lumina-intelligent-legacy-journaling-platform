import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart, UserPlus, Trash2, Mail, ShieldCheck, Clock,
  Loader2, History, Link as LinkIcon, ShieldAlert,
  Calendar, Eye, Download, Printer, Lock, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { LegacyShare, LegacyAuditLog } from '@shared/types';
import { format, formatDistanceToNow } from 'date-fns';
export function LegacySettings() {
  const journals = useAppStore(s => s.journals);
  const legacyContacts = useAppStore(s => s.legacyContacts);
  const addLegacyContact = useAppStore(s => s.addLegacyContact);
  const removeLegacyContact = useAppStore(s => s.removeLegacyContact);
  const auditLogs = useAppStore(s => s.legacyAuditLogs);
  const fetchAuditLogs = useAppStore(s => s.fetchLegacyAuditLogs);
  const isSaving = useAppStore(s => s.isSaving);
  const user = useAppStore(s => s.user);
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState({ view: true, download: false, print: false });
  const [sharePassword, setSharePassword] = useState('');
  const [shareHint, setShareHint] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);
  const handleAddContact = async () => {
    if (!newName || !newEmail) return;
    await addLegacyContact({ name: newName, email: newEmail, relationship });
    setNewName('');
    setNewEmail('');
    setRelationship('');
    toast.success('Trusted recipient added to your inner circle.');
  };
  const handleGenerateLink = async (journalId: string) => {
    setGeneratingFor(journalId);
    try {
      const data = await api<LegacyShare>('/api/legacy/generate-link', {
        method: 'POST',
        body: JSON.stringify({
          journalId,
          recipientEmail: legacyContacts[0]?.email || 'inner-circle@lumina.io',
          permissions: {
            canView: selectedPermissions.view,
            canDownload: selectedPermissions.download,
            canPrint: selectedPermissions.print
          },
          password: sharePassword || undefined,
          passwordHint: shareHint || undefined,
          expiryDays: parseInt(expiryDays)
        })
      });
      const link = `${window.location.origin}/shared/${data.id}?key=${data.accessKey}`;
      setShareLinks(prev => ({ ...prev, [journalId]: link }));
      toast.success('Secure legacy link generated');
      fetchAuditLogs();
    } catch (error) {
      toast.error('Failed to secure sharing tunnel');
    } finally {
      setGeneratingFor(null);
    }
  };
  const lastHeartbeat = user?.lastHeartbeatAt ? new Date(user.lastHeartbeatAt) : new Date();
  return (
    <AppLayout container>
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <Heart size={20} fill="currentColor" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Legacy Moat System</span>
            </div>
            <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">Transmission Control</h1>
            <p className="text-stone-500 mt-2 font-light">
              Architect your digital heritage. Manage trusted recipients, configure security barriers, and monitor access to your most private reflections.
            </p>
          </div>
          <Card className="p-4 bg-stone-900 text-white border-none rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Moat Status</p>
              <p className="text-sm font-medium">Secured & Active</p>
            </div>
          </Card>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <UserPlus size={18} /> The Inner Circle
                </CardTitle>
                <CardDescription>Trusted people authorized to receive your transmissions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 min-h-[100px]">
                  {legacyContacts.length === 0 ? (
                    <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                      <p className="text-xs text-stone-400 font-serif italic">Your inner circle is currently empty.</p>
                    </div>
                  ) : (
                    legacyContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/50 border border-stone-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-medium">
                            {contact.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{contact.name}</p>
                            <p className="text-[10px] text-stone-500 uppercase tracking-wider">{contact.relationship || 'Legacy Recipient'}</p>
                          </div>
                        </div>
                        <button onClick={() => removeLegacyContact(contact.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="pt-4 border-t border-stone-100 space-y-3">
                  <Input placeholder="Recipient Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="rounded-xl" />
                  <Input placeholder="Recipient Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="rounded-xl" />
                  <Input placeholder="Relationship (Optional)" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="rounded-xl" />
                  <Button onClick={handleAddContact} className="w-full rounded-xl bg-stone-900 text-white" disabled={!newName || !newEmail || isSaving}>
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Authorize Recipient'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm bg-rose-50/30 border-rose-100">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2 text-rose-900">
                  <ShieldAlert size={18} /> Emergency Trigger
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Inactivity Handover</p>
                    <p className="text-[10px] text-stone-500">Triggers if no activity for 30 days.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="p-3 bg-white rounded-xl border border-rose-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Last Activity</span>
                  <span className="text-[10px] font-medium text-stone-900">{formatDistanceToNow(lastHeartbeat)} ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-4xl border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="bg-stone-50 border-b border-stone-100 p-6">
                <h2 className="text-xl font-serif font-medium flex items-center gap-2">
                  <LinkIcon size={18} className="text-stone-400" /> Secure Link Generation
                </h2>
                <p className="text-xs text-stone-500 mt-1">Configure granular permissions and barriers for each shared archive.</p>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">1. Granular Permissions</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                        <div className="flex items-center gap-2">
                          <Eye size={14} className="text-stone-400" />
                          <span className="text-xs font-medium">Read Only Access</span>
                        </div>
                        <Checkbox checked={selectedPermissions.view} onCheckedChange={(v) => setSelectedPermissions(p => ({ ...p, view: !!v }))} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                        <div className="flex items-center gap-2">
                          <Download size={14} className="text-stone-400" />
                          <span className="text-xs font-medium">Allow PDF Download</span>
                        </div>
                        <Checkbox checked={selectedPermissions.download} onCheckedChange={(v) => setSelectedPermissions(p => ({ ...p, download: !!v }))} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                        <div className="flex items-center gap-2">
                          <Printer size={14} className="text-stone-400" />
                          <span className="text-xs font-medium">Allow Printing</span>
                        </div>
                        <Checkbox checked={selectedPermissions.print} onCheckedChange={(v) => setSelectedPermissions(p => ({ ...p, print: !!v }))} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">2. Security Barriers</Label>
                    <div className="space-y-3">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                        <Input placeholder="Access Password (Optional)" type="password" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} className="pl-9 rounded-xl text-xs" />
                      </div>
                      <div className="relative">
                        <Info className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                        <Input placeholder="Password Hint" value={shareHint} onChange={(e) => setShareHint(e.target.value)} className="pl-9 rounded-xl text-xs" />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                        <Select value={expiryDays} onValueChange={setExpiryDays}>
                          <SelectTrigger className="pl-9 rounded-xl text-xs h-10">
                            <SelectValue placeholder="Link Expiry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">Expire in 7 days</SelectItem>
                            <SelectItem value="30">Expire in 30 days</SelectItem>
                            <SelectItem value="90">Expire in 90 days</SelectItem>
                            <SelectItem value="0">Never Expire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">3. Select Archive</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {journals.map(j => (
                      <div key={j.id} className="p-4 rounded-2xl bg-white border border-stone-100 flex items-center justify-between group hover:border-stone-400 transition-all">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{j.title}</span>
                          <span className="text-[10px] text-stone-400">{j.type}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={generatingFor === j.id}
                          onClick={() => handleGenerateLink(j.id)}
                          className="rounded-full h-8 text-xs hover:bg-stone-900 hover:text-white"
                        >
                          {generatingFor === j.id ? <Loader2 className="animate-spin h-3 w-3" /> : 'Generate'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                {Object.keys(shareLinks).length > 0 && (
                  <div className="mt-8 pt-8 border-t border-stone-100 space-y-4 animate-fade-in">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-rose-500">Generated Secure Links</Label>
                    {Object.entries(shareLinks).map(([jid, link]) => (
                      <div key={jid} className="p-3 bg-stone-900 text-white rounded-xl flex items-center gap-3">
                        <div className="flex-1 truncate text-[10px] font-mono opacity-60">{link}</div>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-white hover:bg-white/10" onClick={() => {
                          navigator.clipboard.writeText(link);
                          toast.success('Secure link copied to clipboard');
                        }}>Copy Link</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-stone-50 border-b border-stone-100">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <History size={18} className="text-stone-400" /> Transmission Audit Log
                </CardTitle>
                <CardDescription>Real-time tracking of recipient interactions with your archives.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                  {auditLogs.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 font-serif italic text-sm">No transmission history recorded.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-stone-400 border-b border-stone-50">
                          <th className="px-6 py-4 font-bold">Action</th>
                          <th className="px-6 py-4 font-bold">Recipient</th>
                          <th className="px-6 py-4 font-bold">Time</th>
                          <th className="px-6 py-4 font-bold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-stone-50">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[9px] font-bold uppercase",
                                log.action === 'view' ? "bg-blue-50 text-blue-600" :
                                log.action === 'download' ? "bg-emerald-50 text-emerald-600" :
                                log.action === 'revoke' ? "bg-rose-50 text-rose-600" : "bg-stone-100 text-stone-600"
                              )}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium">{log.recipientEmail}</td>
                            <td className="px-6 py-4 text-stone-400">{format(new Date(log.timestamp), 'MMM dd, HH:mm')}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-[10px] text-stone-300 truncate max-w-[100px] inline-block">ID: ...{log.shareId.slice(-6)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-stone-50/50 border-t border-stone-100 py-3 flex justify-center">
                <Button variant="ghost" size="sm" onClick={fetchAuditLogs} className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900">
                  <History size={12} className="mr-2" /> Refresh Audit Trail
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}