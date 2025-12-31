import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { User, Shield, Crown, Loader2, Camera } from 'lucide-react';
export function ProfilePage() {
  const user = useAppStore(s => s.user);
  const updateProfile = useAppStore(s => s.updateProfile);
  const isSaving = useAppStore(s => s.isSaving);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    email: user?.email || '',
    profileImage: user?.profileImage || ''
  });
  const handleSave = async () => {
    await updateProfile(editData);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <header>
          <h1 className="text-4xl font-serif font-medium text-stone-900 dark:text-stone-50">Profile Settings</h1>
          <p className="text-stone-500 mt-2 font-light">Manage your identity and how you appear in your legacy.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User size={18} /> Personal Identity</CardTitle>
                <CardDescription>Your details are used for legacy transmission and insights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-3xl bg-stone-100 flex items-center justify-center text-stone-300 overflow-hidden border-2 border-dashed border-stone-200">
                      {editData.profileImage ? (
                        <img src={editData.profileImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                      <Camera className="text-white" size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium text-stone-900">{user?.name}</h3>
                    <p className="text-sm text-stone-500">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={editData.name} 
                      onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={editData.email} 
                      disabled
                      className="rounded-xl bg-stone-50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Your Bio</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Share a brief description of yourself..."
                      value={editData.bio}
                      onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))}
                      className="rounded-xl min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-stone-50/50 border-t border-stone-100">
                <Button onClick={handleSave} disabled={isSaving} className="ml-auto rounded-xl bg-stone-900 text-white px-8">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
            <Card className="rounded-3xl border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield size={18} /> Security</CardTitle>
                <CardDescription>Manage your sanctuary's protection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-stone-500">Add an extra layer of security (Coming Soon).</p>
                  </div>
                  <Button variant="outline" size="sm" disabled className="rounded-xl">Enable</Button>
                </div>
                <Button variant="ghost" className="text-stone-500 text-sm">Reset Password</Button>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="rounded-3xl border-stone-900 bg-stone-900 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-500"><Crown size={18} /> Lumina Tier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-serif">Free Plan</div>
                <ul className="text-xs text-stone-400 space-y-2">
                  <li className="flex items-center gap-2">✓ Unlimited journals</li>
                  <li className="flex items-center gap-2">✓ Basic AI insights</li>
                  <li className="flex items-center gap-2">✓ 1 Legacy contact</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white text-stone-900 hover:bg-stone-200 rounded-xl">Upgrade to Pro</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}