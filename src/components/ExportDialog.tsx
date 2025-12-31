import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Image as ImageIcon, Calendar, Settings2, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Journal, Entry, ExportOptions } from '@shared/types';
import { toast } from 'sonner';
interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journal: Journal;
  entries: Entry[];
}
export function ExportDialog({ open, onOpenChange, journal, entries }: ExportDialogProps) {
  const user = useAppStore(s => s.user);
  const logExport = useAppStore(s => s.logExport);
  const exportJournalPdf = useAppStore(s => s.exportJournalPdf);
  const [isExporting, setIsExporting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    title: journal.title,
    author: user?.name || 'Lumina Author',
    includeImages: true,
    includeTags: true,
    customMessage: "This archive is a reflection of my journey.",
    highContrast: false,
    startDate: '',
    endDate: ''
  });
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportJournalPdf(journal.id, options);
      // Log after successful download trigger
      await logExport({ journalId: journal.id, format: 'pdf', status: 'success', options });
      setIsFinished(true);
      toast.success('Journal archive generated successfully');
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) setIsFinished(false);
    }}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Export Archive</DialogTitle>
          <DialogDescription>Create a beautifully formatted PDF of your journal.</DialogDescription>
        </DialogHeader>
        {isFinished ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-medium">Archive Ready</h3>
              <p className="text-stone-500 text-sm mt-1">Your document has been downloaded and logged in your history.</p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="rounded-xl px-8">Done</Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-stone-100 rounded-xl p-1">
                <TabsTrigger value="general" className="rounded-lg">General</TabsTrigger>
                <TabsTrigger value="content" className="rounded-lg">Content</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Archive Title</Label>
                  <Input 
                    value={options.title} 
                    onChange={e => setOptions({...options, title: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Author Attribution</Label>
                  <Input 
                    value={options.author} 
                    onChange={e => setOptions({...options, author: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cover Page Message</Label>
                  <Textarea 
                    value={options.customMessage} 
                    onChange={e => setOptions({...options, customMessage: e.target.value})}
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
              </TabsContent>
              <TabsContent value="content" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input 
                      type="date" 
                      value={options.startDate} 
                      onChange={e => setOptions({...options, startDate: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input 
                      type="date" 
                      value={options.endDate} 
                      onChange={e => setOptions({...options, endDate: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-stone-400" />
                      <Label className="text-sm">Include Images</Label>
                    </div>
                    <Switch 
                      checked={options.includeImages} 
                      onCheckedChange={v => setOptions({...options, includeImages: v})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 size={16} className="text-stone-400" />
                      <Label className="text-sm">High Contrast Mode</Label>
                    </div>
                    <Switch 
                      checked={options.highContrast} 
                      onCheckedChange={v => setOptions({...options, highContrast: v})} 
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button 
                onClick={handleExport} 
                disabled={isExporting} 
                className="w-full bg-stone-900 text-white rounded-xl py-6"
              >
                {isExporting ? <span className="flex items-center"><Loader2 className="animate-spin mr-2" size={18} /> Edge Generation...</span> : <><Download size={18} className="mr-2" /> Generate Archive</>}
                Generate Archive
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}