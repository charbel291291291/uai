import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Zap, Shield, Globe, ArrowRight,
  Bot, TrendingUp, Flame, Crown,
  CreditCard, Key, Watch, Tag,
  CheckCircle2, Package, Smartphone, Nfc, Info, Layers
} from 'lucide-react';
import { useAuth } from '../App';
import { NEON_THEMES } from '../constants';
import type { LucideIcon } from 'lucide-react';

// ─── Icon Badge Component ─────────────────────────────────────────
const IconBadge = ({
  icon: Icon,
  color,
  size = 26,
  badgeSize = 'lg',
}: {
  icon: LucideIcon;
  color: string;
  size?: number;
  badgeSize?: 'md' | 'lg' | 'xl';
}) => {
  const dims = { md: 'w-12 h-12 rounded-xl', lg: 'w-16 h-16 rounded-2xl', xl: 'w-20 h-20 rounded-3xl' };
  return (
    <div
      className={`${dims[badgeSize]} flex items-center justify-center shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        boxShadow: `0 0 24px ${color}40`,
      }}
    >
      <Icon size={size} color="#000" strokeWidth={2.2} />
    </div>
  );
};

// ─── Data ─────────────────────────────────────────────────────────
const MODES: { icon: LucideIcon; label: string; color: string; desc: string; feature: string }[] = [
  {
    icon: Bot,
    label: 'AI Mode',
    color: '#3A86FF',
    desc: 'Visitors chat with your AI Twin, powered by Gemini. It answers questions about you 24/7.',
    feature: 'Best for Personal Brand & Creators',
  },
  {
    icon: Globe,
    label: 'Landing Mode',
    color: '#10B981',
    desc: 'A clean, fast page with your services, links, and CTAs. No fluff, just results.',
    feature: 'Best for Professionals & Freelancers',
  },
  {
    icon: TrendingUp,
    label: 'Sales Mode',
    color: '#F59E0B',
    desc: 'Service cards with prices and Order Now buttons. Turn every profile visit into a sale.',
    feature: 'Best for Businesses & Services',
  },
];

const PLANS: {
  name: string; icon: LucideIcon; type: string;
  price: string; note: string; color: string;
  features: string[]; cta: string; popular?: boolean;
}[] = [
  {
    name: 'Basic', icon: Zap, type: 'One-time',
    price: '$15', note: 'Pay once, yours forever',
    color: '#A855F7',
    features: ['Landing Mode Profile', 'Up to 3 Services', 'Custom Links', 'Contact Form'],
    cta: 'Get Basic',
  },
  {
    name: 'Pro', icon: Flame, type: 'Monthly',
    price: '$5/mo', note: 'or $50/year — save $10',
    color: '#00C6FF',
    features: ['All Basic', 'AI Mode (Chat Twin)', 'Unlimited Services', 'Analytics', 'Premium Themes'],
    cta: 'Go Pro', popular: true,
  },
  {
    name: 'Elite', icon: Crown, type: 'Monthly',
    price: '$10/mo', note: 'Full power unlocked',
    color: '#F59E0B',
    features: ['All Pro', 'Sales Mode', 'Full Gemini AI', 'Advanced Analytics', 'NFC Priority'],
    cta: 'Go Elite',
  },
];

const NFC_ITEMS: { icon: LucideIcon; name: string; price: string; color: string }[] = [
  { icon: CreditCard, name: 'NFC Card',     price: '$12', color: '#3A86FF' },
  { icon: Key,        name: 'NFC Keychain', price: '$10', color: '#10B981' },
  { icon: Watch,      name: 'NFC Bracelet', price: '$9',  color: '#A855F7' },
  { icon: Tag,        name: 'NFC Sticker',  price: '$6',  color: '#F59E0B' },
];

// ─── Component ─────────────────────────────────────────────────────
export default function Home() {
  const { theme, setTheme } = useAuth();

  const cycleTheme = () => {
    const currentIndex = NEON_THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % NEON_THEMES.length;
    setTheme(NEON_THEMES[nextIndex].id);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 overflow-hidden space-y-40">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="text-center relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-glow blur-[120px] rounded-full -z-10"
        />

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-sm font-bold mb-8 shadow-[0_0_15px_var(--accent-glow)]">
          <Sparkles size={15} /> The Future of Digital Identity
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
          className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85] uppercase">
          Elevate Your <br />
          <span className="text-uai-gradient glow-neon">Digital Soul.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-xl text-brand-text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
          One profile. Three powerful modes. An AI that speaks for you. Physical NFC products that tap into your identity.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link to="/login"
            className="btn-neon w-full sm:w-auto text-black font-black text-xl flex items-center justify-center gap-2 group">
            Get Started Free
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
          </Link>
          <button onClick={cycleTheme}
            className="w-full sm:w-auto px-10 py-5 glass-neon text-brand-text font-bold text-xl rounded-full hover:bg-white/10 transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-2">
            <Sparkles size={18} className="text-brand-accent" /> Switch Theme
          </button>
        </motion.div>
      </div>

      {/* ── FEATURE GRID ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
        {[
          { icon: Zap,      title: 'Instant Setup',    desc: 'Connect your socials and let AI build your persona in seconds.' },
          { icon: Globe,    title: 'Public Profile',   desc: 'A beautiful page that converts visitors into clients.' },
          { icon: Shield,   title: 'Secure Identity',  desc: 'Google authentication and Supabase-backed data.' },
          { icon: Sparkles, title: 'AI Twin',          desc: 'Your AI twin answers questions from your knowledge base, 24/7.' },
        ].map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -8 }}
            className="p-9 glass-neon rounded-[36px] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-glow blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity" />
            <f.icon className="text-brand-accent mb-7 glow-neon group-hover:scale-110 transition-transform" size={36} />
            <h3 className="text-xl font-black mb-3 text-brand-text tracking-tight">{f.title}</h3>
            <p className="text-brand-text-muted text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* ── 3 PROFILE MODES ───────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-sm font-bold mb-5">
            <Layers size={14} /> 3 Profile Modes
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">
            One Profile. <span className="text-uai-gradient">Three Personalities.</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            Switch how your profile looks in one click. Each mode is optimized for a different goal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {MODES.map((mode, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }} whileHover={{ y: -6 }}
              className="relative p-8 glass-neon rounded-[36px] overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
                style={{ background: mode.color }} />
              <div className="mb-6">
                <IconBadge icon={mode.icon} color={mode.color} badgeSize="lg" size={26} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{mode.label}</h3>
              <p className="text-white/45 text-sm leading-relaxed mb-5">{mode.desc}</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold border"
                style={{ color: mode.color, borderColor: `${mode.color}40`, background: `${mode.color}10` }}>
                {mode.feature}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── NFC PRODUCTS ──────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-sm font-bold mb-5">
            <Nfc size={14} /> Physical + Digital
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">
            Tap to Share. <span className="text-uai-gradient">No App Needed.</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            Our NFC products link directly to your UAi profile. One tap opens your full digital identity — AI twin, services, and all.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          {NFC_ITEMS.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -8, scale: 1.02 }}
              className="relative p-8 glass-neon rounded-[32px] text-center group overflow-hidden cursor-pointer">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{ background: p.color }} />
              <div className="flex justify-center mb-5">
                <IconBadge icon={p.icon} color={p.color} badgeSize="xl" size={30} />
              </div>
              <h3 className="font-black text-white text-base mb-2">{p.name}</h3>
              <p className="text-2xl font-black" style={{ color: p.color }}>{p.price}</p>
            </motion.div>
          ))}
        </div>

        <div className="p-8 md:p-12 glass-neon rounded-[40px] flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="shrink-0">
            <IconBadge icon={Smartphone} color="#3A86FF" badgeSize="xl" size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black text-white mb-2">How It Works</h3>
            <p className="text-white/45 leading-relaxed">
              We program your UAi profile URL into the NFC chip. Tap the product with any smartphone — your full profile opens instantly.
              Available for delivery across <strong className="text-white/70">Lebanon</strong>.
            </p>
          </div>
          <Link to="/login"
            className="btn-neon text-black font-black whitespace-nowrap flex items-center gap-2 shrink-0">
            Order Now <ArrowRight size={18} />
          </Link>
        </div>
      </motion.section>

      {/* ── PRICING ───────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-sm font-bold mb-5">
            <Package size={14} /> Simple Pricing
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">
            Built for <span className="text-uai-gradient">Lebanon.</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            Affordable plans with real value. No hidden fees. Pay once or subscribe — your call.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {PLANS.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className={`relative flex flex-col p-8 glass-neon rounded-[36px] overflow-hidden ${plan.popular ? 'scale-[1.03]' : ''}`}
              style={plan.popular ? { borderColor: `${plan.color}40`, boxShadow: `0 0 40px ${plan.color}15` } : {}}>

              {plan.popular && (
                <div className="absolute top-5 right-5">
                  <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-black"
                    style={{ background: plan.color }}>
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <IconBadge icon={plan.icon} color={plan.color} badgeSize="lg" size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-1">{plan.name}</h3>
              <div className="mb-1">
                <span className="text-4xl font-black" style={{ color: plan.color }}>{plan.price}</span>
              </div>
              <p className="text-xs text-white/30 mb-6">{plan.note}</p>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                    <CheckCircle2 size={14} style={{ color: plan.color }} className="shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link to="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all hover:brightness-110 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}99)`, color: '#000' }}>
                {plan.cta} <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="relative text-center p-16 glass-neon rounded-[48px] overflow-hidden">
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 bg-brand-glow blur-[100px] -z-10" />
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-5 uppercase">
          Your Digital Identity<br />
          <span className="text-uai-gradient glow-neon">Starts Here.</span>
        </h2>
        <p className="text-lg text-white/40 max-w-xl mx-auto mb-10">
          Join creators, professionals, and businesses in Lebanon and beyond who use UAi to present themselves to the world.
        </p>
        <Link to="/login"
          className="btn-neon text-black font-black text-xl inline-flex items-center gap-3 group">
          Create Your Profile Free
          <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.section>

    </div>
  );
}
