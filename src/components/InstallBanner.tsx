import { motion, AnimatePresence } from 'motion/react';
import { Download, X, CheckCircle2 } from 'lucide-react';
import { useLang } from '../hooks/useLang';

interface Props {
  isInstallable: boolean;
  justInstalled: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export default function InstallBanner({ isInstallable, justInstalled, onInstall, onDismiss }: Props) {
  const { t } = useLang();

  return (
    <AnimatePresence>

      {/* ── Install prompt ─────────────────────────────────────── */}
      {isInstallable && (
        <motion.div
          key="install-banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed bottom-20 md:bottom-6 inset-x-3 md:inset-x-auto md:right-5 md:w-80 z-[60]"
        >
          <div
            className="glass-neon border border-white/15 rounded-3xl p-4 shadow-2xl"
            style={{ boxShadow: '0 0 40px var(--accent-glow), 0 24px 60px rgba(0,0,0,0.6)' }}
          >
            <button
              onClick={onDismiss}
              className="absolute top-3 end-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={13} className="text-white/50" />
            </button>

            <div className="flex items-center gap-3">
              {/* App icon */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-lg ring-1 ring-white/10">
                <img src="/icons/icon-512x512.png" alt="UAi" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0 pe-6">
                <p className="font-black text-white text-sm leading-tight mb-0.5">{t('install.title')}</p>
                <p className="text-[11px] text-white/40 leading-snug mb-3">{t('install.desc')}</p>
                <button
                  onClick={onInstall}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-black transition-all active:scale-95 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, var(--accent-primary), #00C6FF)' }}
                >
                  <Download size={13} />
                  {t('install.cta')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Installed toast ────────────────────────────────────── */}
      {justInstalled && (
        <motion.div
          key="installed-toast"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed bottom-24 md:bottom-6 inset-x-3 md:inset-x-auto md:right-5 md:w-auto z-[60]"
        >
          <div
            className="glass-neon border border-green-500/30 rounded-2xl px-5 py-3 flex items-center gap-3"
            style={{ boxShadow: '0 0 24px rgba(16,185,129,0.25)' }}
          >
            <CheckCircle2 size={18} className="text-green-400 shrink-0" />
            <span className="text-sm font-bold text-white">{t('install.installed')}</span>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
