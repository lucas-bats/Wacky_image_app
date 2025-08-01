
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { translations } from '@/lib/translations';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [lang, setLang] = useState<'en' | 'pt'>('pt');
  
  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator.language.startsWith('en')) {
      setLang('en');
    }
  }, []);

  const T = translations[lang].auth;
  const TGlobal = translations[lang];

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
       toast({
        title: T.signupSuccess,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-headline">
      <Card className="w-full max-w-md shadow-2xl border-4 border-border rounded-2xl">
        <CardHeader className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter" style={{ textShadow: '2px 2px 0 hsl(var(--secondary)), 3px 3px 0 hsl(var(--primary))'}}>
              {TGlobal.title}
            </h1>
          <CardTitle className="text-3xl tracking-tight">{T.signupTitle}</CardTitle>
          <CardDescription className="font-body text-lg">{T.signupSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{T.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{T.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-14 text-xl" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
              {T.signupButton}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center font-body text-lg">
          <p>
            {T.haveAccount}{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              {T.loginLink}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
