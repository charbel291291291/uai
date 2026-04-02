import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Zap, Globe, Shield, ArrowRight,
  CheckCircle2, Package, Layers, Nfc, Download, Smartphone,
} from 'lucide-react';
import { useAuth } from '../App';
import { useLang } from '../hooks/useLang';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { i18n } from '../i18n';
import { NEON_THEMES } from '../constants';
import { SEO } from '../components/SEO';

// ── Static data (images + colors — labels come from i18n) ─────────────────
const MODE_META  = [
  { img: '/images/mode-ai.png',      color: '#3A86FF' },
  { img: '/images/mode-landing.png', color: '#10B981' },
  { img: '/images/mode-sales.png',   color: '#F59E0B' },
];
const PLAN_META  = [
  { img: '/images/plan-basic.png',  color: '#A855F7', price: '$15'    },
  { img: '/images/plan-pro.png',    color: '#00C6FF', price: '$5/mo', popular: true },
  { img: '/images/plan-elite.png',  color: '#F59E0B', price: '$10/mo' },
];
const NFC_META   = [
  { img: '/images/nfc-card.png',     color: '#3A86FF' },
  { img: '/images/nfc-keychain.png', color: '#10B981' },
  { img: '/images/nfc-bracelet.png', color: '#A855F7' },
  { img: '/images/nfc-sticker.png',  color: '#F59E0B' },
];
const FEAT_ICONS = [Zap, Globe, Shield, Sparkles];

// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const { theme, setTheme }       = useAuth();
  const { lang, isRTL }           = useLang();
  const { isInstallable, install } = useInstallPrompt();

  const tr    = i18n[lang].home;
  const Arrow = isRTL ? <ArrowRight className="rtl-flip shrink-0" size={20} /> : <ArrowRight className="shrink-0" size={20} />;

  const cycleTheme = () => {
    const idx = NEON_THEMES.findIndex(t => t.id === theme);
    setTheme(NEON_THEMES[(idx + 1) % NEON_THEMES.length].id);
  };

  return (
    <>
      <SEO
        title="UAi - Your Digital AI Twin"
        description="Create your digital AI twin with UAi. Connect via NFC, manage multiple profiles, and experience the future of digital identity. Free to start."
        type="website"
      />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 overflow-x-hidden space-y-20 sm:space-y-28 md:space-y-40">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="text-center relative" aria-labelledby="hero-heading">
        {/* Ambient glow - decorative */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[min(600px,100vw)] h-[min(600px,100vw)] bg-brand-glow blur-[120px] rounded-full -z-10 pointer-events-none"
          aria-hidden="true"
        />

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-xs sm:text-sm font-bold mb-6 sm:mb-8 shadow-[0_0_15px_var(--accent-glow)]"
          role="text"
        >
          <Sparkles size={14} aria-hidden="true" /> {tr.badge}
        </motion.div>

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
          className="text-[clamp(2.8rem,10vw,7rem)] font-black tracking-tighter mb-6 sm:mb-8 leading-[0.9] uppercase"
        >
          {tr.h1a} <br />
          <span className="text-uai-gradient glow-neon">{tr.h1b}</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-brand-text-muted max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
          {tr.sub}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-5 px-2">
          <Link to="/login"
            className="btn-neon text-white font-black text-base sm:text-xl flex items-center justify-center gap-2 group"
            aria-label="Get started with UAi - Create your digital AI twin">
            {tr.ctaStart}
            <span className="group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" aria-hidden="true">{Arrow}</span>
          </Link>
          <button onClick={cycleTheme}
            className="px-6 sm:px-10 py-4 sm:py-5 glass-neon text-brand-text font-bold text-base sm:text-xl rounded-full hover:bg-white/10 transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-2"
            aria-label="Cycle through theme colors">
            <Sparkles size={16} className="text-brand-accent" aria-hidden="true" /> {tr.ctaTheme}
          </button>
        </motion.div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" role="list">
          {tr.features.map((f, i) => {
            const Icon = FEAT_ICONS[i];
            return (
              <div 
                key={i}
                role="listitem"
                className="p-6 sm:p-9 glass-neon rounded-[28px] sm:rounded-[36px] transition-all duration-200 hover:-translate-y-1.5 group relative overflow-hidden"
                tabIndex={0}
              >
                <div className="absolute top-0 end-0 w-32 h-32 bg-brand-glow blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-200" aria-hidden="true" />
                <Icon className="text-brand-accent mb-5 sm:mb-7 group-hover:scale-110 transition-transform duration-200" size={32} aria-hidden="true" />
                <h3 className="text-lg sm:text-xl font-black mb-2 sm:mb-3 text-brand-text tracking-tight">{f.title}</h3>
                <p className="text-brand-text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3 PROFILE MODES ────────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-xs sm:text-sm font-bold mb-4 sm:mb-5">
            <Layers size={13} /> {tr.modesBadge}
          </div>
          <h2 className="text-[clamp(2rem,6vw,3.75rem)] font-black tracking-tighter mb-3 sm:mb-4">
            {tr.modesTitle} <span className="text-uai-gradient">{tr.modesTitleAccent}</span>
          </h2>
          <p className="text-sm sm:text-lg text-white/40 max-w-xl mx-auto px-2">{tr.modesSub}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-7">
          {tr.modes.map((mode, i) => (
            <div key={i}
              className="relative glass-neon rounded-[28px] sm:rounded-[36px] overflow-hidden group transition-transform duration-200 hover:-translate-y-1.5">
              <div className="relative h-44 sm:h-52 overflow-hidden">
                <img src={MODE_META[i].img} alt={mode.label} loading="lazy" decoding="async"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
              </div>
              <div className="p-5 sm:p-7">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2">{mode.label}</h3>
                <p className="text-white/45 text-sm leading-relaxed mb-4 sm:mb-5">{mode.desc}</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold border"
                  style={{ color: MODE_META[i].color, borderColor: `${MODE_META[i].color}40`, background: `${MODE_META[i].color}10` }}>
                  {mode.feature}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── NFC PRODUCTS ───────────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-xs sm:text-sm font-bold mb-4 sm:mb-5">
            <Nfc size={13} /> {tr.nfcBadge}
          </div>
          <h2 className="text-[clamp(2rem,6vw,3.75rem)] font-black tracking-tighter mb-3 sm:mb-4">
            {tr.nfcTitle} <span className="text-uai-gradient">{tr.nfcTitleAccent}</span>
          </h2>
          <p className="text-sm sm:text-lg text-white/40 max-w-xl mx-auto px-2">{tr.nfcSub}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
          {NFC_META.map((p, i) => (
            <div key={i}
              className="glass-neon rounded-[22px] sm:rounded-[28px] overflow-hidden group cursor-pointer transition-transform duration-200 hover:-translate-y-2">
              <div className="relative h-36 sm:h-44 overflow-hidden bg-white/5">
                <img src={p.img} alt={tr.nfcItems[i]} loading="lazy" decoding="async"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-4 sm:p-5 text-center">
                <h3 className="font-black text-white text-xs sm:text-sm mb-1">{tr.nfcItems[i]}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="p-6 sm:p-8 md:p-10 glass-neon rounded-[28px] sm:rounded-[40px] flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="w-full md:w-64 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0">
            <img src="/images/nfc-how.png" alt={tr.nfcHowTitle} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center md:text-start">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-3">{tr.nfcHowTitle}</h3>
            <p className="text-white/45 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base">{tr.nfcHowDesc}</p>
            <Link to="/login"
              className="btn-neon text-black font-black inline-flex items-center gap-2 text-sm sm:text-base py-3 px-6">
              {tr.nfcOrderBtn} {Arrow}
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-xs sm:text-sm font-bold mb-4 sm:mb-5">
            <Package size={13} /> {tr.pricingBadge}
          </div>
          <h2 className="text-[clamp(2rem,6vw,3.75rem)] font-black tracking-tighter mb-3 sm:mb-4">
            {tr.pricingTitle} <span className="text-uai-gradient">{tr.pricingTitleAccent}</span>
          </h2>
          <p className="text-sm sm:text-lg text-white/40 max-w-xl mx-auto px-2">{tr.pricingSub}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-7">
          {tr.plans.map((plan, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className={`relative flex flex-col glass-neon rounded-[28px] sm:rounded-[36px] overflow-hidden ${PLAN_META[i].popular ? 'ring-1' : ''}`}
              style={PLAN_META[i].popular ? { borderColor: `${PLAN_META[i].color}40`, boxShadow: `0 0 40px ${PLAN_META[i].color}15` } : {}}>

              {PLAN_META[i].popular && (
                <div className="absolute top-4 end-4 z-10">
                  <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-black"
                    style={{ background: PLAN_META[i].color }}>
                    {tr.popular}
                  </span>
                </div>
              )}

              <div className="relative h-36 sm:h-40 overflow-hidden">
                <img src={PLAN_META[i].img} alt={plan.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
              </div>

              <div className="p-5 sm:p-7 flex flex-col flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-1">{plan.name}</h3>
                <div className="mb-1">
                  <span className="text-3xl sm:text-4xl font-black" style={{ color: PLAN_META[i].color }}>
                    {PLAN_META[i].price}
                  </span>
                </div>
                <p className="text-xs text-white/30 mb-5 sm:mb-6">{plan.note}</p>

                <ul className="space-y-2.5 sm:space-y-3 flex-1 mb-6 sm:mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                      <CheckCircle2 size={13} style={{ color: PLAN_META[i].color }} className="shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-2xl font-black text-sm transition-all hover:brightness-110 active:scale-95 text-black"
                  style={{ background: `linear-gradient(135deg, ${PLAN_META[i].color}, ${PLAN_META[i].color}99)` }}>
                  {plan.cta} {Arrow}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── INSTALL SECTION (mobile-first PWA CTA) ─────────────────────────── */}
      {isInstallable && (
        <motion.section
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative p-7 sm:p-10 glass-neon rounded-[28px] sm:rounded-[40px] overflow-hidden flex flex-col sm:flex-row items-center gap-6 text-center sm:text-start">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute inset-0 bg-brand-glow blur-[80px] -z-10 pointer-events-none" />

          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shrink-0 ring-2 ring-white/15 shadow-xl">
            <img src="/icons/icon-512x512.png" alt="UAi App" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-neon text-brand-accent text-xs font-bold mb-3">
              <Smartphone size={12} /> PWA
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">{tr.installTitle}</h2>
            <p className="text-white/45 text-sm leading-relaxed mb-5">{tr.installDesc}</p>
            <button onClick={install}
              className="btn-neon text-black font-black text-sm inline-flex items-center gap-2 py-3 px-7">
              <Download size={16} /> {tr.installBtn}
            </button>
          </div>
        </motion.section>
      )}

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="relative text-center p-8 sm:p-12 md:p-16 glass-neon rounded-[32px] sm:rounded-[48px] overflow-hidden">
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 bg-brand-glow blur-[100px] -z-10 pointer-events-none" />

        <h2 className="text-[clamp(2rem,7vw,4.5rem)] font-black tracking-tighter text-white mb-4 sm:mb-5 uppercase leading-tight">
          {tr.ctaTitle}<br />
          <span className="text-uai-gradient glow-neon">{tr.ctaAccent}</span>
        </h2>
        <p className="text-sm sm:text-lg text-white/40 max-w-xl mx-auto mb-8 sm:mb-10 px-2">{tr.ctaSub}</p>
        <Link to="/login"
          className="btn-neon text-black font-black text-base sm:text-xl inline-flex items-center gap-2 sm:gap-3 group py-4 px-8">
          {tr.ctaBtn}
          <span className="group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">{Arrow}</span>
        </Link>
      </motion.section>

    </div>
    </>
  );
}
