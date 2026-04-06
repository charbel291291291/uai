import { motion } from 'motion/react';
import { Phone, MessageCircle, Globe, Share2, MapPin } from 'lucide-react';
import type { UserProfile, UserLink } from '../types';

interface ProfileHeroProps {
  profile: UserProfile;
  onCTAClick?: (type: string) => void;
}

export function ProfileHero({ profile, onCTAClick }: ProfileHeroProps) {
  const initials = (profile.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const themeColor = profile.themeColor || '#3A86FF';

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${profile.displayName} | eyedeaz`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    onCTAClick?.('share');
  };

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${themeColor}22 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-md px-4 pb-8 pt-10 text-center">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative mx-auto mb-5 h-28 w-28"
        >
          <div
            className="absolute inset-0 rounded-full opacity-40 blur-xl"
            style={{ background: themeColor }}
            aria-hidden="true"
          />
          <div
            className="relative h-28 w-28 overflow-hidden rounded-full border-4"
            style={{ borderColor: `${themeColor}60` }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-3xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${themeColor}, #000)` }}
              >
                {initials}
              </div>
            )}
          </div>
        </motion.div>

        {/* Name + bio */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {profile.displayName}
          </h1>

          {profile.username && (
            <p className="mt-1 text-sm text-white/40">@{profile.username}</p>
          )}

          {profile.bio && (
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/55">
              {profile.bio}
            </p>
          )}
        </motion.div>

        {/* Primary CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-6 flex justify-center gap-3"
        >
          {profile.whatsapp && (
            <a
              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onCTAClick?.('whatsapp')}
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              style={{
                background: '#25D366',
                boxShadow: '0 0 20px rgba(37,211,102,0.3)',
              }}
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}

          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              onClick={() => onCTAClick?.('call')}
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:bg-white/12"
              aria-label="Call"
            >
              <Phone size={16} />
              Call
            </a>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/60 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:text-white hover:bg-white/10"
            aria-label="Share profile"
          >
            <Share2 size={16} />
          </button>
        </motion.div>

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-white/50"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
