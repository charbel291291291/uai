import { motion } from 'motion/react';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserPlan } from '../../types';

interface PricingPlan {
  id: Exclude<UserPlan, 'free'> | 'free';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  glowColor: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Start building your digital identity.',
    features: [
      'Public profile page',
      'Up to 3 links',
      '1 profile mode',
      'Basic analytics',
      'NFC card compatible',
    ],
    cta: 'Get Started',
    ctaLink: '/login',
    icon: Sparkles,
    accentColor: 'text-white/60',
    glowColor: 'rgba(255,255,255,0.05)',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 5,
    period: 'month',
    description: 'For creators and professionals.',
    features: [
      'Everything in Free',
      'AI chat twin',
      'Unlimited links',
      'All 3 profile modes',
      'Advanced analytics',
      'Premium themes',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    ctaLink: '/upgrade',
    icon: Zap,
    accentColor: 'text-[#3A86FF]',
    glowColor: 'rgba(58,134,255,0.15)',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 10,
    period: 'month',
    description: 'Full power for businesses.',
    features: [
      'Everything in Pro',
      'Sales mode',
      'Advanced analytics',
      'NFC priority shipping',
      'Custom domain',
      'White-label options',
      'Dedicated support',
    ],
    cta: 'Go Elite',
    ctaLink: '/upgrade',
    popular: true,
    icon: Crown,
    accentColor: 'text-[#F59E0B]',
    glowColor: 'rgba(245,158,11,0.15)',
  },
];

interface PricingTableProps {
  currentPlan?: UserPlan;
  compact?: boolean;
}

export function PricingTable({ currentPlan = 'free', compact = false }: PricingTableProps) {
  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'} items-stretch`}>
      {PLANS.map((plan, i) => {
        const Icon = plan.icon;
        const isCurrentPlan = currentPlan === plan.id;
        const isFree = plan.id === 'free';

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`
              relative flex flex-col rounded-[28px] border p-6 transition-all duration-300
              ${plan.popular
                ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5 shadow-[0_0_60px_rgba(245,158,11,0.12)]'
                : 'border-white/8 bg-white/[0.02] hover:border-white/15'
              }
            `}
            style={{ background: plan.popular ? undefined : undefined }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B] px-4 py-1 text-xs font-bold text-black">
                  <Crown size={10} />
                  Most Popular
                </span>
              </div>
            )}

            {/* Current plan badge */}
            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
                  Current plan
                </span>
              </div>
            )}

            {/* Header */}
            <div className="mb-5">
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${plan.accentColor}`}
                style={{ background: plan.glowColor }}
              >
                <Icon size={18} />
              </div>
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-white/45">{plan.description}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {isFree ? 'Free' : `$${plan.price}`}
                </span>
                {!isFree && (
                  <span className="text-sm text-white/40">/{plan.period}</span>
                )}
              </div>
            </div>

            {/* Features */}
            {!compact && (
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-white/65">
                    <Check
                      size={15}
                      className={`mt-0.5 shrink-0 ${plan.popular ? 'text-[#F59E0B]' : plan.id === 'pro' ? 'text-[#3A86FF]' : 'text-white/40'}`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <Link
              to={plan.ctaLink}
              className={`
                mt-auto block w-full rounded-2xl py-3 text-center text-sm font-semibold transition-all duration-200
                ${isCurrentPlan
                  ? 'cursor-default border border-white/10 bg-white/5 text-white/40'
                  : plan.popular
                    ? 'bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90 hover:-translate-y-0.5'
                    : plan.id === 'pro'
                      ? 'border border-[#3A86FF]/40 bg-[#3A86FF]/10 text-[#3A86FF] hover:bg-[#3A86FF]/20 hover:-translate-y-0.5'
                      : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:-translate-y-0.5'
                }
              `}
              tabIndex={isCurrentPlan ? -1 : undefined}
              aria-disabled={isCurrentPlan}
            >
              {isCurrentPlan ? 'Current Plan' : plan.cta}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
