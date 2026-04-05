import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Globe,
  Shield,
  ArrowRight,
  CheckCircle2,
  Package,
  Layers,
  Nfc,
  Download,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../App';
import { useLang } from '../hooks/useLang';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { i18n } from '../i18n';
import { NEON_THEMES } from '../constants';
import { SEO } from '../components/SEO';

const MODE_META = [
  { img: '/images/mode-ai.webp', color: '#3A86FF' },
  { img: '/images/mode-landing.webp', color: '#10B981' },
  { img: '/images/mode-sales.webp', color: '#F59E0B' },
];

const PLAN_META = [
  { img: '/images/plan-basic.webp', color: '#A855F7', price: '$15' },
  { img: '/images/plan-pro.webp', color: '#00C6FF', price: '$5/mo', popular: true },
  { img: '/images/plan-elite.webp', color: '#F59E0B', price: '$10/mo' },
];

const NFC_META = [
  { img: '/images/nfc-card.webp', color: '#3A86FF', name: 'NFC Smart Card', price: '$12.99', id: 'nfc-card' },
  { img: '/images/nfc-keychain.webp', color: '#10B981', name: 'NFC Keychain', price: '$14.99', id: 'nfc-keychain' },
  { img: '/images/nfc-bracelet.webp', color: '#A855F7', name: 'NFC Bracelet', price: '$22.99', id: 'nfc-bracelet' },
  { img: '/images/nfc-sticker.webp', color: '#F59E0B', name: 'NFC Sticker Pack', price: '$9.99', id: 'nfc-sticker' },
];

const FEAT_ICONS = [Zap, Globe, Shield, Sparkles];

const sectionTitleClass = 'text-[clamp(2rem,5vw,3.6rem)] font-black tracking-tight text-white';
const surfaceClass = 'rounded-[28px] border border-white/5 bg-white/[0.02]';

export default function Home() {
  const { theme, setTheme } = useAuth();
  const { lang, isRTL } = useLang();
  const { isInstallable, install } = useInstallPrompt();
  const navigate = useNavigate();

  const tr = i18n[lang].home;
  const Arrow = isRTL ? <ArrowRight className="rtl-flip shrink-0" size={18} /> : <ArrowRight className="shrink-0" size={18} />;

  const cycleTheme = () => {
    const idx = NEON_THEMES.findIndex((t) => t.id === theme);
    setTheme(NEON_THEMES[(idx + 1) % NEON_THEMES.length].id);
  };

  return (
    <>
      <SEO
        title="UAi - Your Digital AI Twin"
        description="Create your digital AI twin with UAi. Connect via NFC, manage multiple profiles, and experience the future of digital identity. Free to start."
        type="website"
      />

      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-24 sm:space-y-32">
          <section className="relative pt-4 text-center sm:pt-8" aria-labelledby="hero-heading">
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.12, 0.2, 0.12] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-glow blur-[110px]"
              aria-hidden="true"
            />

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                  <Sparkles size={14} className="text-brand-accent" />
                  {tr.badge}
                </div>

                <h1 id="hero-heading" className="mx-auto max-w-4xl text-[clamp(2.8rem,8vw,5.5rem)] font-black leading-[0.92] tracking-tight text-white">
                  {tr.h1a}
                  <br />
                  <span className="text-uai-gradient">{tr.h1b}</span>
                </h1>

                <p className="mx-auto max-w-xl text-base leading-7 text-white/45 sm:text-lg">
                  {tr.sub}
                </p>
              </div>

              <div className="flex justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5 sm:text-base"
                  aria-label="Get started with UAi"
                >
                  {tr.ctaStart}
                  {Arrow}
                </Link>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={cycleTheme}
                  className="inline-flex items-center gap-2 text-sm text-white/35 transition-colors hover:text-white/60"
                  aria-label="Cycle through theme colors"
                >
                  <Sparkles size={14} className="text-brand-accent" />
                  {tr.ctaTheme}
                </button>
              </div>
            </motion.div>
          </section>

          <section aria-labelledby="features-heading" className="space-y-10">
            <div className="space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Features</p>
              <h2 id="features-heading" className={sectionTitleClass}>
                Clear tools for a modern identity
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/42 sm:text-base">
                Everything is designed to make your digital twin easier to create, share, and grow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
              {tr.features.map((feature, index) => {
                const Icon = FEAT_ICONS[index];
                return (
                  <motion.div
                    key={index}
                    role="listitem"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className={`${surfaceClass} p-6`}
                  >
                    <Icon className="mb-5 text-brand-accent" size={28} aria-hidden="true" />
                    <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm leading-6 text-white/42">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="space-y-10">
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                <Layers size={13} className="text-brand-accent" />
                {tr.modesBadge}
              </div>
              <h2 className={sectionTitleClass}>
                {tr.modesTitle} <span className="text-uai-gradient">{tr.modesTitleAccent}</span>
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/42 sm:text-base">{tr.modesSub}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {tr.modes.map((mode, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className={`${surfaceClass} overflow-hidden`}
                >
                  <div className="h-48 overflow-hidden">
                    <img src={MODE_META[index].img} alt={mode.label} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-white">{mode.label}</h3>
                      <p className="text-sm leading-6 text-white/42">{mode.desc}</p>
                    </div>
                    <span
                      className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{
                        color: MODE_META[index].color,
                        borderColor: `${MODE_META[index].color}30`,
                        background: `${MODE_META[index].color}10`,
                      }}
                    >
                      {mode.feature}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                <Nfc size={13} className="text-brand-accent" />
                Explore Products
              </div>
              <h2 className={sectionTitleClass}>
                {tr.nfcTitle} <span className="text-uai-gradient">{tr.nfcTitleAccent}</span>
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/42 sm:text-base">{tr.nfcSub}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {NFC_META.map((product, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/shop?highlight=${product.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/shop?highlight=${product.id}`);
                    }
                  }}
                  className={`${surfaceClass} group cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-brand-cyan/40 focus:outline-none focus-visible:border-brand-cyan/40`}
                >
                  <div className="relative h-40 overflow-hidden bg-white/[0.03] sm:h-48">
                    <img
                      src={product.img}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                    <div className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {product.price}
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-white sm:text-base">{product.name}</h3>
                      <p className="text-sm text-white/38">A premium preview from the UAi store.</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-brand-accent">{product.price}</span>
                      <span className="inline-flex items-center gap-1 text-white/40 transition-colors group-hover:text-white/70">
                        View in Shop
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className={`${surfaceClass} flex flex-col items-center gap-6 p-6 text-center md:flex-row md:items-center md:gap-8 md:p-8 md:text-left`}>
              <div className="h-44 w-full max-w-sm overflow-hidden rounded-[24px] bg-white/[0.03] md:h-48 md:w-72">
                <img src="/images/nfc-how.webp" alt={tr.nfcHowTitle} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>

              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-semibold text-white">{tr.nfcHowTitle}</h3>
                <p className="max-w-xl text-sm leading-6 text-white/42 sm:text-base">{tr.nfcHowDesc}</p>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white px-6 py-3 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {tr.nfcOrderBtn}
                  {Arrow}
                </Link>
              </div>
            </div>
          </section>

          <section className="space-y-10">
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                <Package size={13} className="text-brand-accent" />
                {tr.pricingBadge}
              </div>
              <h2 className={sectionTitleClass}>
                {tr.pricingTitle} <span className="text-uai-gradient">{tr.pricingTitleAccent}</span>
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/42 sm:text-base">{tr.pricingSub}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {tr.plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className={`${surfaceClass} relative flex flex-col overflow-hidden`}
                >
                  {PLAN_META[index].popular && (
                    <div className="absolute right-4 top-4 z-10">
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black"
                        style={{ background: PLAN_META[index].color }}
                      >
                        {tr.popular}
                      </span>
                    </div>
                  )}

                  <div className="h-40 overflow-hidden">
                    <img src={PLAN_META[index].img} alt={plan.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </div>

                  <div className="flex flex-1 flex-col space-y-5 p-6">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                      <div>
                        <span className="text-4xl font-black" style={{ color: PLAN_META[index].color }}>
                          {PLAN_META[index].price}
                        </span>
                      </div>
                      <p className="text-xs text-white/30">{plan.note}</p>
                    </div>

                    <ul className="flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5 text-sm text-white/50">
                          <CheckCircle2 size={14} style={{ color: PLAN_META[index].color }} className="shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/login"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5"
                      style={{ background: `linear-gradient(135deg, ${PLAN_META[index].color}, ${PLAN_META[index].color}CC)` }}
                    >
                      {plan.cta}
                      {Arrow}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {isInstallable && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`${surfaceClass} flex flex-col items-center gap-6 p-7 text-center sm:flex-row sm:text-left`}
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-white/[0.03]">
                <img src="/icons/icon-512x512.png" alt="UAi App" className="h-full w-full object-cover" />
              </div>

              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                  <Smartphone size={12} className="text-brand-accent" />
                  PWA
                </div>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">{tr.installTitle}</h2>
                <p className="max-w-xl text-sm leading-6 text-white/42">{tr.installDesc}</p>
              </div>

              <button
                onClick={install}
                className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white px-6 py-3 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5"
              >
                <Download size={16} />
                {tr.installBtn}
              </button>
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl space-y-6 rounded-[36px] border border-white/5 bg-white/[0.02] px-6 py-12 text-center sm:px-10 sm:py-16"
          >
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Get Started</p>
              <h2 className="text-[clamp(2.2rem,5vw,4rem)] font-black leading-tight tracking-tight text-white">
                {tr.ctaTitle}
                <br />
                <span className="text-uai-gradient">{tr.ctaAccent}</span>
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/42 sm:text-base">{tr.ctaSub}</p>
            </div>

            <div className="flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5 sm:text-base"
              >
                {tr.ctaBtn}
                {Arrow}
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
}
