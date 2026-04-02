import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Check, Sparkles, Zap, Crown, Wallet, Banknote, Building2,
  Upload, ArrowRight, Loader2, Clock, Shield, X
} from 'lucide-react';
import { useAuth } from '../App';
import { useSubscription, useCreatePaymentRequest } from '../hooks/useSubscription';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { UserPlan, PaymentMethod } from '../types';

const PLANS = [
  {
    id: 'pro' as Exclude<UserPlan, 'free' | 'elite'>,
    name: 'Pro',
    price: 5,
    period: 'month',
    description: 'Perfect for professionals and creators',
    icon: Zap,
    color: '#00C6FF',
    features: [
      'AI Mode (Chat Twin)',
      'Unlimited Services',
      'Analytics Dashboard',
      'Premium Themes',
      'Priority Support',
    ],
  },
  {
    id: 'elite' as Exclude<UserPlan, 'free' | 'pro'>,
    name: 'Elite',
    price: 10,
    period: 'month',
    description: 'Full power for businesses',
    icon: Crown,
    color: '#F59E0B',
    popular: true,
    features: [
      'Everything in Pro',
      'Sales Mode',
      'Advanced Analytics',
      'NFC Priority',
      'Custom Domain',
      'White-label Options',
    ],
  },
];

const PAYMENT_METHODS = [
  {
    id: 'whish' as PaymentMethod,
    label: 'Whish Money',
    icon: Wallet,
    account: '03/123 456',
    note: 'Send exact amount in USD',
  },
  {
    id: 'omt' as PaymentMethod,
    label: 'OMT',
    icon: Banknote,
    account: 'Lebanon / Beirut / 03/123 456',
    note: 'Receiver: UAi by eyedeaz',
  },
  {
    id: 'bank' as PaymentMethod,
    label: 'Bank Transfer',
    icon: Building2,
    account: 'BDL - 1234567890',
    note: 'IBAN: LB12 1234 5678 9012 3456 7890 1234',
  },
];

export default function Upgrade() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { subscription, paymentHistory, loading: subLoading, refetch } = useSubscription(user?.id);
  const { createPaymentRequest, loading: creating } = useCreatePaymentRequest();

  const [selectedPlan, setSelectedPlan] = useState<Exclude<UserPlan, 'free'> | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'payment' | 'upload' | 'success'>('select');
  const [error, setError] = useState<string | null>(null);

  const currentPlan = subscription?.plan || 'free';
  const isPending = paymentHistory.some(p => p.status === 'pending');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!user || !selectedPlan || !selectedMethod || !proofFile) return;

    setError(null);
    const result = await createPaymentRequest(user.id, selectedPlan, selectedMethod, proofFile);

    if (result.success) {
      setStep('success');
      await refetch();
    } else {
      setError(result.error || 'Failed to submit payment request');
    }
  };

  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-sm font-bold mb-6"
          >
            <Sparkles size={16} />
            Upgrade Your Experience
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-white mb-4"
          >
            Choose Your <span className="text-gradient">Plan</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 max-w-xl mx-auto"
          >
            Unlock premium features with our Lebanon-friendly payment options. No credit card required.
          </motion.p>
        </div>

        {/* Current Plan Banner */}
        {currentPlan !== 'free' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="p-6 border-brand-accent/30 bg-brand-accent/5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                    <Crown className="text-brand-accent" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</h3>
                    <p className="text-sm text-white/50">
                      {subscription?.expires_at
                        ? `Expires in ${Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                        : 'Active subscription'}
                    </p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Pending Payment Warning */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="p-6 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="text-yellow-500" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">Payment Under Review</h3>
                  <p className="text-sm text-white/50">
                    Your payment is being reviewed. You'll be notified once approved.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 1: Select Plan */}
        {step === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = currentPlan === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative p-8 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-brand-accent'
                      : ''
                  } ${isCurrent ? 'opacity-60' : ''}`}
                  onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary">Most Popular</Badge>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="success">Current</Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: `${plan.color}20` }}
                    >
                      <Icon style={{ color: plan.color }} size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                      <p className="text-white/50 text-sm">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-white">${plan.price}</span>
                    <span className="text-white/50">/{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-white/70">
                        <Check size={18} className="text-brand-accent shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={selectedPlan === plan.id ? 'primary' : 'secondary'}
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setStep('payment');
                    }}
                  >
                    {isCurrent ? 'Current Plan' : selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </Button>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Step 2: Payment Instructions */}
        {step === 'payment' && selectedPlan && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Button
              variant="ghost"
              onClick={() => setStep('select')}
              className="mb-6"
            >
              ← Back to Plans
            </Button>

            <Card className="p-8">
              <h2 className="text-2xl font-black text-white mb-2">
                Complete Your Payment
              </h2>
              <p className="text-white/50 mb-8">
                Choose your preferred payment method and follow the instructions
              </p>

              <div className="space-y-4 mb-8">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'border-brand-accent bg-brand-accent/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedMethod === method.id ? 'bg-brand-accent/20' : 'bg-white/5'
                        }`}>
                          <Icon className={selectedMethod === method.id ? 'text-brand-accent' : 'text-white/50'} size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white">{method.label}</h3>
                          <p className="text-sm text-white/50">{method.account}</p>
                          <p className="text-xs text-white/30 mt-1">{method.note}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedMethod === method.id
                            ? 'border-brand-accent bg-brand-accent'
                            : 'border-white/20'
                        }`}>
                          {selectedMethod === method.id && <Check size={14} className="text-black" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-8">
                <div className="flex items-start gap-3">
                  <Shield className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-white/70">
                      <strong className="text-white">Amount to send: ${PLANS.find(p => p.id === selectedPlan)?.price}</strong>
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Please send the exact amount. Include your username ({profile?.username}) in the payment note.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                disabled={!selectedMethod}
                onClick={() => setStep('upload')}
              >
                I've Completed the Payment
                <ArrowRight size={18} />
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Upload Proof */}
        {step === 'upload' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Button
              variant="ghost"
              onClick={() => setStep('payment')}
              className="mb-6"
            >
              ← Back to Payment
            </Button>

            <Card className="p-8">
              <h2 className="text-2xl font-black text-white mb-2">
                Upload Payment Proof
              </h2>
              <p className="text-white/50 mb-8">
                Take a screenshot of your payment confirmation and upload it here
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  proofPreview
                    ? 'border-brand-accent bg-brand-accent/5'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {proofPreview ? (
                  <div className="relative">
                    <img
                      src={proofPreview}
                      alt="Payment proof"
                      className="max-h-64 mx-auto rounded-xl"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofFile(null);
                        setProofPreview(null);
                      }}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 rounded-full text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Upload className="text-white/40" size={32} />
                    </div>
                    <p className="font-bold text-white mb-2">Click to upload screenshot</p>
                    <p className="text-sm text-white/40">JPG, PNG, WebP (max 5MB)</p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                className="w-full mt-8"
                disabled={!proofFile || creating}
                onClick={handleSubmit}
              >
                {creating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Payment Request
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="p-12">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="text-green-500" size={40} />
              </div>

              <h2 className="text-2xl font-black text-white mb-4">
                Payment Submitted!
              </h2>

              <p className="text-white/50 mb-8">
                Your payment is under review. You'll receive a notification once approved, usually within 24 hours.
              </p>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('select');
                    setSelectedPlan(null);
                    setSelectedMethod(null);
                    setProofFile(null);
                    setProofPreview(null);
                  }}
                >
                  Back to Plans
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && step === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-xl font-bold text-white mb-6">Payment History</h2>
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        payment.status === 'approved' ? 'bg-green-500/20' :
                        payment.status === 'rejected' ? 'bg-red-500/20' :
                        'bg-yellow-500/20'
                      }`}>
                        {payment.status === 'approved' ? <Check size={20} className="text-green-500" /> :
                         payment.status === 'rejected' ? <X size={20} className="text-red-500" /> :
                         <Clock size={20} className="text-yellow-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-white capitalize">{payment.plan} Plan</p>
                        <p className="text-sm text-white/50">
                          {payment.payment_method.toUpperCase()} • ${payment.amount}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        payment.status === 'approved' ? 'success' :
                        payment.status === 'rejected' ? 'danger' :
                        'warning'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
