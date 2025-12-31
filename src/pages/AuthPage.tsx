import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Sparkles, Loader2, ArrowLeft, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';
type AuthView = 'main' | 'forgot' | 'reset';
export function AuthPage() {
  const login = useAppStore(s => s.login);
  const register = useAppStore(s => s.register);
  const forgotPassword = useAppStore(s => s.forgotPassword);
  const resetPassword = useAppStore(s => s.resetPassword);
  const isLoading = useAppStore(s => s.isLoading);
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>('main');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', resetToken: '' });
  const [resetSuccess, setResetSuccess] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const handleAuth = async (type: 'login' | 'register') => {
    try {
      if (type === 'login') {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      navigate('/dashboard');
    } catch (e) { /* error handled by store toast */ }
  };
  const handleForgot = async () => {
    try {
      const res = await forgotPassword(formData.email);
      if (res.debugToken) setDebugToken(res.debugToken);
      setResetSuccess(true);
      toast.success(res.message);
    } catch (e) { toast.error("Recovery failed"); }
  };
  const handleReset = async () => {
    try {
      await resetPassword(formData.resetToken, formData.password);
      setView('main');
      setResetSuccess(false);
      setDebugToken(null);
    } catch (e) { toast.error("Reset failed"); }
  };
  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center px-4">
        <Button variant="ghost" className="absolute top-8 left-8" onClick={() => setView('main')}>
          <ArrowLeft size={16} className="mr-2" /> Back to Login
        </Button>
        <Card className="w-full max-w-md rounded-4xl border-stone-200 shadow-xl overflow-hidden">
          <CardHeader className="bg-stone-50 border-b border-stone-100 p-8 text-center">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-stone-900 items-center justify-center text-white mb-4">
              <ShieldAlert size={24} />
            </div>
            <CardTitle className="text-2xl font-serif">Restore Access</CardTitle>
            <CardDescription>We'll provide a secure tunnel back to your sanctuary.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {!resetSuccess ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Registered Email</Label>
                  <Input 
                    type="email" 
                    placeholder="julian@lumina.io" 
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <Button onClick={handleForgot} disabled={isLoading} className="w-full bg-stone-900 text-white rounded-xl py-6">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Instructions'}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm text-stone-600">Instructions dispatched. If the account exists, you will receive them shortly.</p>
                {debugToken && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold uppercase text-amber-700 mb-2">Simulated Reset Link</p>
                    <Button variant="outline" className="w-full text-xs h-8" onClick={() => {
                      setFormData(p => ({ ...p, resetToken: debugToken }));
                      setView('reset');
                    }}>
                      Use Reset Token: {debugToken}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  if (view === 'reset') {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-4xl border-stone-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-stone-900 items-center justify-center text-white mb-4">
              <Lock size={24} />
            </div>
            <CardTitle className="text-2xl font-serif">Set New Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reset Token</Label>
              <Input disabled value={formData.resetToken} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
              />
            </div>
            <Button onClick={handleReset} disabled={isLoading} className="w-full bg-stone-900 text-white rounded-xl py-6">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Update Security Barrier'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
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
                <Button onClick={() => handleAuth('login')} disabled={isLoading} className="w-full bg-stone-900 text-white rounded-xl py-6">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </CardContent>
              <CardFooter className="pt-0 justify-center">
                <Button variant="link" className="text-xs text-stone-400" onClick={() => setView('forgot')}>
                  Forgotten your password?
                </Button>
              </CardFooter>
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
                  <Input id="reg-name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
                </div>
                <Button onClick={() => handleAuth('register')} disabled={isLoading} className="w-full bg-stone-900 text-white rounded-xl py-6">
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