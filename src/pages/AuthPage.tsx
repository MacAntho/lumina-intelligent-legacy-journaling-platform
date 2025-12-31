import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';
export function AuthPage() {
  const login = useAppStore(s => s.login);
  const register = useAppStore(s => s.register);
  const isLoading = useAppStore(s => s.isLoading);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const handleAuth = async (type: 'login' | 'register') => {
    try {
      if (type === 'login') {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      navigate('/dashboard');
    } catch (e) {
      // Errors handled by store/sonner
    }
  };
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center px-4">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft size={16} /> Home
      </Link>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-stone-900 items-center justify-center text-white mb-4">
            <Sparkles size={24} />
          </div>
          <h1 className="text-3xl font-serif font-medium tracking-tight">Lumina</h1>
          <p className="text-stone-500 font-light italic">Your digital legacy starts here.</p>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-stone-100 p-1">
            <TabsTrigger value="login" className="rounded-lg">Login</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card className="border-stone-200 rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif">Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access your sanctuary.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="julian@lumina.io"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={() => handleAuth('login')} 
                  disabled={isLoading}
                  className="w-full bg-stone-900 text-white rounded-xl py-6"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card className="border-stone-200 rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif">Create Account</CardTitle>
                <CardDescription>Begin your journey of reflection today.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="Julian Stone"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="julian@lumina.io"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={() => handleAuth('register')} 
                  disabled={isLoading}
                  className="w-full bg-stone-900 text-white rounded-xl py-6"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Sanctuary
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}