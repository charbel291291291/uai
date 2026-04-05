import { supabase } from '../supabase';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function Login() {
  const [searchParams] = useSearchParams();

  const handleLogin = async () => {
    try {
      // Store the intended destination so we can redirect after OAuth completes
      const requestedRedirectPath = searchParams.get('redirect') || '/dashboard';
      const redirectPath =
        requestedRedirectPath.startsWith('/') && !requestedRedirectPath.startsWith('//')
          ? requestedRedirectPath
          : '/dashboard';
      // Store with timestamp so AppShell can discard stale entries
      localStorage.setItem('auth_redirect', JSON.stringify({ path: redirectPath, ts: Date.now() }));

      // redirectTo must be the app origin — this URL must be in Supabase
      // Authentication → URL Configuration → Redirect URLs allowlist
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <>
      <SEO
        title="Login"
        description="Sign in to UAi with Google to create and manage your digital AI twin. Secure authentication for your digital identity."
        type="website"
      />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass-card border border-white/10 rounded-3xl text-center"
      >
        <h1 className="text-4xl font-bold mb-4 tracking-tight text-uai-gradient">Welcome to UAi</h1>
        <p className="text-white/60 mb-8">Connect your Google account to start building your digital AI identity.</p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-brand-cyan to-brand-blue-electric text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-all active:scale-[0.95] active:shadow-lg glow-uai shadow-[0_10px_30px_rgba(0,198,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(0,198,255,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/20 transform hover:-translate-y-1 duration-200"
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
      </motion.div>
    </div>
    </>
  );
}
