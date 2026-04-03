import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { useSubscription } from '../hooks/useSubscription';
import type { UserProfile, Service, Testimonial, UserLink } from '../types';
import {
  User, Link as LinkIcon, Sparkles, Plus, Trash2, Save,
  LayoutDashboard, MessageSquare, Star, BarChart3, Users,
  Settings, ChevronRight, ExternalLink, CheckCircle2,
  AlertCircle, Eye, TrendingUp, Zap, Crown, Lock, ArrowLeft,
  Shield, Package, DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, StatCard } from '../components/ui/Card';
import { Input, TextArea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { SEO } from '../components/SEO';
import { isAdmin, ADMIN_ROUTES } from '../config/admin';

// ─── Sidebar Navigation ─────────────────────────────────────────────────────
const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'services', label: 'Services', icon: Sparkles },
  { id: 'testimonials', label: 'Testimonials', icon: Star },
  { id: 'links', label: 'Links', icon: LinkIcon },
  { id: 'ai', label: 'AI Training', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'leads', label: 'Leads', icon: Users },
];

// ─── Dashboard Component ────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, profile: authProfile } = useAuth();
  const { subscription, hasFeature, isPlan, isExpired, daysRemaining } = useSubscription(user?.id);
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const currentPlan = subscription?.plan || 'free';

  // Initialize form data
  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
    } else if (user) {
      setProfile({
        uid: user.id,
        displayName: user.user_metadata?.full_name || '',
        username: '',
        bio: '',
        services: [],
        links: [],
        testimonials: [],
        qaPairs: [],
      });
    }
  }, [authProfile, user]);

  // Fetch leads and messages
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [{ data: leadsData }, { data: messagesData }] = await Promise.all([
        supabase.from('leads').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (leadsData) setLeads(leadsData);
      if (messagesData) setMessages(messagesData);
    };

    fetchData();
  }, [user]);

  // Save profile
  const handleSave = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: profile.username?.toLowerCase(),
        display_name: profile.displayName,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        theme_color: profile.themeColor,
        services: profile.services,
        testimonials: profile.testimonials,
        links: profile.links,
        qa_pairs: profile.qaPairs,
        ai_persona: profile.aiPersona,
        whatsapp: profile.whatsapp,
        phone: profile.phone,
        mode: profile.mode || 'ai',
      });

      if (error) throw error;
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [user, profile]);

  // Service handlers
  const addService = () => {
    setProfile((p) => ({
      ...p,
      services: [
        ...(p.services || []),
        {
          id: Date.now().toString(),
          title: '',
          description: '',
          price: '',
          ctaLabel: 'Get Started',
          featured: false,
        },
      ],
    }));
  };

  const updateService = (index: number, field: keyof Service, value: any) => {
    setProfile((p) => ({
      ...p,
      services: p.services?.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removeService = (index: number) => {
    setProfile((p) => ({
      ...p,
      services: p.services?.filter((_, i) => i !== index),
    }));
  };

  // Link handlers
  const addLink = () => {
    setProfile((p) => ({
      ...p,
      links: [...(p.links || []), { title: '', url: '' }],
    }));
  };

  const updateLink = (index: number, field: keyof UserLink, value: string) => {
    setProfile((p) => ({
      ...p,
      links: p.links?.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));
  };

  const removeLink = (index: number) => {
    setProfile((p) => ({
      ...p,
      links: p.links?.filter((_, i) => i !== index),
    }));
  };

  // Testimonial handlers
  const addTestimonial = () => {
    setProfile((p) => ({
      ...p,
      testimonials: [
        ...(p.testimonials || []),
        {
          id: Date.now().toString(),
          name: '',
          role: '',
          text: '',
          rating: 5,
        },
      ],
    }));
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: any) => {
    setProfile((p) => ({
      ...p,
      testimonials: p.testimonials?.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  };

  const removeTestimonial = (index: number) => {
    setProfile((p) => ({
      ...p,
      testimonials: p.testimonials?.filter((_, i) => i !== index),
    }));
  };

  // QA handlers
  const addQA = () => {
    setProfile((p) => ({
      ...p,
      qaPairs: [...(p.qaPairs || []), { question: '', answer: '' }],
    }));
  };

  const updateQA = (index: number, field: 'question' | 'answer', value: string) => {
    setProfile((p) => ({
      ...p,
      qaPairs: p.qaPairs?.map((qa, i) => (i === index ? { ...qa, [field]: value } : qa)),
    }));
  };

  const removeQA = (index: number) => {
    setProfile((p) => ({
      ...p,
      qaPairs: p.qaPairs?.filter((_, i) => i !== index),
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Please sign in to access your dashboard</p>
      </div>
    );
  }

  const tc = profile.themeColor || '#3A86FF';

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <SEO
        title="Dashboard"
        description="Manage your digital AI twin profile, services, testimonials, and AI training. Access analytics and leads from your personal dashboard."
        type="website"
      />
      <div className="min-h-screen flex">
      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 fixed left-0 top-0 h-screen border-r border-white/5 bg-[#020617]/80 backdrop-blur-xl hidden lg:block">
        <div className="p-6">
          {/* ── Back to Home Button ── */}
          <Link to="/"
            className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium border border-white/10 hover:border-white/20"
            aria-label="Back to home">
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#3A86FF] flex items-center justify-center">
              <Zap size={18} className="text-black" />
            </div>
            <span className="font-bold text-lg text-white">UAi</span>
          </Link>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#3A86FF]/10 text-[#3A86FF] border border-[#3A86FF]/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5">
          {profile.username && (
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
            >
              <ExternalLink size={16} />
              <span className="text-sm font-medium">View Profile</span>
            </a>
          )}
        </div>
      </aside>

      {/* ─── Mobile Nav ──────────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 p-4 overflow-x-auto no-scrollbar">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#3A86FF]/10 text-[#3A86FF] border border-[#3A86FF]/20'
                    : 'text-white/60 hover:text-white bg-white/5'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {sidebarItems.find((i) => i.id === activeTab)?.label}
              </h1>
              {profile.username && (
                <p className="text-sm text-white/40">@{profile.username}</p>
              )}
            </div>

            <Button
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={
                saveStatus === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : saveStatus === 'error' ? (
                  <AlertCircle size={18} />
                ) : (
                  <Save size={18} />
                )
              }
              variant={saveStatus === 'success' ? 'secondary' : saveStatus === 'error' ? 'danger' : 'primary'}
            >
              {saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Changes'}
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-5xl">
          <AnimatePresence mode="wait">
            {/* ─── Overview Tab ──────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Plan Status Banner */}
                <Card className={`p-6 ${
                  isExpired
                    ? 'border-red-500/30 bg-red-500/5'
                    : currentPlan === 'elite'
                    ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10'
                    : currentPlan === 'pro'
                    ? 'border-brand-accent/30 bg-brand-accent/5'
                    : 'border-white/10'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        isExpired
                          ? 'bg-red-500/20'
                          : currentPlan === 'elite'
                          ? 'bg-yellow-500/20'
                          : currentPlan === 'pro'
                          ? 'bg-brand-accent/20'
                          : 'bg-white/10'
                      }`}>
                        {currentPlan === 'free' ? (
                          <Zap className="text-white/50" size={28} />
                        ) : isExpired ? (
                          <AlertCircle className="text-red-500" size={28} />
                        ) : (
                          <Crown className={
                            currentPlan === 'elite' ? 'text-yellow-500' : 'text-brand-accent'
                          } size={28} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white capitalize">
                          {currentPlan} Plan
                          {isExpired && ' (Expired)'}
                        </h3>
                        <p className="text-white/50">
                          {isExpired
                            ? 'Your subscription has expired. Renew to keep your premium features.'
                            : currentPlan === 'free'
                            ? 'Upgrade to unlock premium features'
                            : daysRemaining
                            ? `${daysRemaining} days remaining`
                            : 'Active subscription'}
                        </p>
                      </div>
                    </div>
                    <Link to="/upgrade">
                      <Button variant={currentPlan === 'free' || isExpired ? 'primary' : 'secondary'}>
                        {currentPlan === 'free' ? 'Upgrade Now' : isExpired ? 'Renew' : 'Manage'}
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Views"
                    value={profile.analytics?.views || 0}
                    icon={<Eye size={18} />}
                  />
                  <StatCard
                    label="Conversations"
                    value={profile.analytics?.chats || 0}
                    icon={<MessageSquare size={18} />}
                  />
                  <StatCard
                    label="Leads"
                    value={leads.length}
                    icon={<Users size={18} />}
                  />
                  <StatCard
                    label="Messages"
                    value={messages.length}
                    icon={<TrendingUp size={18} />}
                  />
                </div>

                {/* Quick Actions */}
                <Card>
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#3A86FF]/10 flex items-center justify-center text-[#3A86FF]">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white">Edit Profile</p>
                        <p className="text-sm text-white/40">Update your info</p>
                      </div>
                      <ChevronRight size={18} className="ml-auto text-white/20" />
                    </button>

                    <button
                      onClick={() => setActiveTab('services')}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#3A86FF]/10 flex items-center justify-center text-[#3A86FF]">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white">Add Services</p>
                        <p className="text-sm text-white/40">{profile.services?.length || 0} services</p>
                      </div>
                      <ChevronRight size={18} className="ml-auto text-white/20" />
                    </button>

                    <button
                      onClick={() => setActiveTab('ai')}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#3A86FF]/10 flex items-center justify-center text-[#3A86FF]">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white">Train AI</p>
                        <p className="text-sm text-white/40">{profile.qaPairs?.length || 0} Q&A pairs</p>
                      </div>
                      <ChevronRight size={18} className="ml-auto text-white/20" />
                    </button>

                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#3A86FF]/10 flex items-center justify-center text-[#3A86FF]">
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white">View Analytics</p>
                        <p className="text-sm text-white/40">Track performance</p>
                      </div>
                      <ChevronRight size={18} className="ml-auto text-white/20" />
                    </button>
                  </div>
                </Card>

                {/* Admin Panel Links (Only for admins) */}
                {isAdmin(authProfile?.username) && (
                  <Card className="border-brand-accent/30 bg-gradient-to-r from-brand-accent/5 to-purple-500/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center">
                        <Shield className="text-brand-accent" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Admin Panel</h3>
                        <p className="text-sm text-white/50">Manage payments and orders</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Link to={ADMIN_ROUTES.MAIN}>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500/30 transition-colors">
                            <DollarSign size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">Payment Requests</p>
                            <p className="text-sm text-white/40">Approve subscriptions</p>
                          </div>
                          <ChevronRight size={18} className="text-white/20" />
                        </div>
                      </Link>

                      <Link to={ADMIN_ROUTES.NFC_ORDERS}>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                            <Package size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">NFC Orders</p>
                            <p className="text-sm text-white/40">Manage deliveries</p>
                          </div>
                          <ChevronRight size={18} className="text-white/20" />
                        </div>
                      </Link>
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {/* ─── Profile Tab ───────────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card>
                  <h3 className="text-lg font-semibold text-white mb-6">Basic Info</h3>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Display Name"
                        value={profile.displayName || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                        placeholder="Your name"
                      />
                      <Input
                        label="Username"
                        value={profile.username || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value.toLowerCase() }))}
                        placeholder="username"
                        disabled={!!authProfile?.username}
                        helperText={authProfile?.username ? 'Cannot be changed' : 'This will be your profile URL'}
                      />
                    </div>

                    <TextArea
                      label="Bio"
                      value={profile.bio || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell people what you do..."
                      rows={3}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="WhatsApp"
                        value={profile.whatsapp || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, whatsapp: e.target.value }))}
                        placeholder="+961 71 000 000"
                      />
                      <Input
                        label="Phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+961 71 000 000"
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-white mb-6">AI Persona</h3>
                  <TextArea
                    label="Personality Instructions"
                    value={profile.aiPersona || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, aiPersona: e.target.value }))}
                    placeholder="Describe how your AI should behave..."
                    rows={4}
                    helperText="This helps your AI respond in your style"
                  />
                </Card>
              </motion.div>
            )}

            {/* ─── Services Tab ──────────────────────────────────────────────── */}
            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Your Services</h3>
                  {/* Plan restriction for unlimited services */}
                  {(hasFeature('unlimited-services') || (profile.services?.length || 0) < 3) ? (
                    <Button size="sm" leftIcon={<Plus size={16} />} onClick={addService}>
                      Add Service
                    </Button>
                  ) : (
                    <Link to="/upgrade">
                      <Button size="sm" variant="secondary">
                        <Lock size={14} className="mr-1" />
                        Upgrade for More
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Service limit warning for free users */}
                {!hasFeature('unlimited-services') && (profile.services?.length || 0) >= 3 && (
                  <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
                    <div className="flex items-center gap-3">
                      <Lock className="text-yellow-500" size={20} />
                      <p className="text-sm text-white/70">
                        Free plan limited to 3 services.{' '}
                        <Link to="/upgrade" className="text-brand-accent hover:underline">
                          Upgrade to Pro
                        </Link>{' '}
                        for unlimited services.
                      </p>
                    </div>
                  </Card>
                )}

                {profile.services?.map((service, i) => (
                  <Card key={service.id}>
                    <div className="flex items-start justify-between mb-4">
                      <Badge size="sm">Service #{i + 1}</Badge>
                      <button
                        onClick={() => removeService(i)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Title"
                          value={service.title}
                          onChange={(e) => updateService(i, 'title', e.target.value)}
                          placeholder="Service name"
                        />
                        <Input
                          label="Price"
                          value={service.price || ''}
                          onChange={(e) => updateService(i, 'price', e.target.value)}
                          placeholder="e.g. $100, Free, Custom"
                        />
                      </div>

                      <TextArea
                        label="Description"
                        value={service.description}
                        onChange={(e) => updateService(i, 'description', e.target.value)}
                        placeholder="Describe this service..."
                        rows={2}
                      />

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`featured-${i}`}
                          checked={service.featured}
                          onChange={(e) => updateService(i, 'featured', e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#3A86FF] focus:ring-[#3A86FF]/20"
                        />
                        <label htmlFor={`featured-${i}`} className="text-sm text-white/70">
                          Feature this service
                        </label>
                      </div>
                    </div>
                  </Card>
                ))}

                {profile.services?.length === 0 && (
                  <Card className="text-center py-12">
                    <Sparkles size={48} className="mx-auto text-white/20 mb-4" />
                    <p className="text-white/50 mb-4">No services yet</p>
                    <Button onClick={addService} leftIcon={<Plus size={16} />}>
                      Add Your First Service
                    </Button>
                  </Card>
                )}
              </motion.div>
            )}

            {/* ─── Testimonials Tab ──────────────────────────────────────────── */}
            {activeTab === 'testimonials' && (
              <motion.div
                key="testimonials"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Testimonials</h3>
                  <Button size="sm" leftIcon={<Plus size={16} />} onClick={addTestimonial}>
                    Add Testimonial
                  </Button>
                </div>

                {profile.testimonials?.map((testimonial, i) => (
                  <Card key={testimonial.id}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => updateTestimonial(i, 'rating', star)}
                            className={`p-1 ${star <= testimonial.rating ? 'text-amber-400' : 'text-white/20'}`}
                          >
                            <Star size={16} className={star <= testimonial.rating ? 'fill-current' : ''} />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => removeTestimonial(i)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Name"
                          value={testimonial.name}
                          onChange={(e) => updateTestimonial(i, 'name', e.target.value)}
                          placeholder="Client name"
                        />
                        <Input
                          label="Role"
                          value={testimonial.role || ''}
                          onChange={(e) => updateTestimonial(i, 'role', e.target.value)}
                          placeholder="e.g. CEO at Company"
                        />
                      </div>

                      <TextArea
                        label="Testimonial"
                        value={testimonial.text}
                        onChange={(e) => updateTestimonial(i, 'text', e.target.value)}
                        placeholder="What they said about you..."
                        rows={3}
                      />
                    </div>
                  </Card>
                ))}

                {profile.testimonials?.length === 0 && (
                  <Card className="text-center py-12">
                    <Star size={48} className="mx-auto text-white/20 mb-4" />
                    <p className="text-white/50 mb-4">No testimonials yet</p>
                    <Button onClick={addTestimonial} leftIcon={<Plus size={16} />}>
                      Add Your First Testimonial
                    </Button>
                  </Card>
                )}
              </motion.div>
            )}

            {/* ─── Links Tab ─────────────────────────────────────────────────── */}
            {activeTab === 'links' && (
              <motion.div
                key="links"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Social Links</h3>
                  <Button size="sm" leftIcon={<Plus size={16} />} onClick={addLink}>
                    Add Link
                  </Button>
                </div>

                {profile.links?.map((link, i) => (
                  <Card key={i}>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Input
                          label="Title"
                          value={link.title}
                          onChange={(e) => updateLink(i, 'title', e.target.value)}
                          placeholder="e.g. Instagram"
                          className="mb-3"
                        />
                        <Input
                          label="URL"
                          value={link.url}
                          onChange={(e) => updateLink(i, 'url', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <button
                        onClick={() => removeLink(i)}
                        className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors mb-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </Card>
                ))}

                {profile.links?.length === 0 && (
                  <Card className="text-center py-12">
                    <LinkIcon size={48} className="mx-auto text-white/20 mb-4" />
                    <p className="text-white/50 mb-4">No links yet</p>
                    <Button onClick={addLink} leftIcon={<Plus size={16} />}>
                      Add Your First Link
                    </Button>
                  </Card>
                )}
              </motion.div>
            )}

            {/* ─── AI Training Tab ───────────────────────────────────────────── */}
            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* AI Mode requires Pro or Elite */}
                {!hasFeature('ai-mode') ? (
                  <Card className="p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-6">
                      <Crown className="text-brand-accent" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">AI Mode is a Pro Feature</h3>
                    <p className="text-white/50 mb-6 max-w-md mx-auto">
                      Upgrade to Pro or Elite to unlock your AI Twin. Your AI will answer questions about you 24/7.
                    </p>
                    <Link to="/upgrade">
                      <Button variant="primary" size="lg">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">AI Knowledge Base</h3>
                      <Button size="sm" leftIcon={<Plus size={16} />} onClick={addQA}>
                        Add Q&A
                      </Button>
                    </div>

                    <p className="text-white/50 text-sm">
                      Add common questions and answers to help your AI respond better.
                    </p>

                {profile.qaPairs?.map((qa, i) => (
                  <Card key={i}>
                    <div className="flex items-start justify-between mb-4">
                      <Badge size="sm">Q&A #{i + 1}</Badge>
                      <button
                        onClick={() => removeQA(i)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <Input
                        label="Question"
                        value={qa.question}
                        onChange={(e) => updateQA(i, 'question', e.target.value)}
                        placeholder="What do people ask?"
                      />
                      <TextArea
                        label="Answer"
                        value={qa.answer}
                        onChange={(e) => updateQA(i, 'answer', e.target.value)}
                        placeholder="How should your AI respond?"
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}

                {profile.qaPairs?.length === 0 && (
                  <Card className="text-center py-12">
                    <MessageSquare size={48} className="mx-auto text-white/20 mb-4" />
                    <p className="text-white/50 mb-4">No Q&A pairs yet</p>
                    <Button onClick={addQA} leftIcon={<Plus size={16} />}>
                      Add Your First Q&A
                    </Button>
                  </Card>
                )}
                  </>
                )}
              </motion.div>
            )}

            {/* ─── Analytics Tab ─────────────────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {!hasFeature('analytics') ? (
                  <Card className="p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="text-brand-accent" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Analytics is a Pro Feature</h3>
                    <p className="text-white/50 mb-6 max-w-md mx-auto">
                      Upgrade to Pro or Elite to unlock detailed analytics about your profile performance.
                    </p>
                    <Link to="/upgrade">
                      <Button variant="primary" size="lg">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard
                        label="Profile Views"
                        value={profile.analytics?.views || 0}
                        icon={<Eye size={18} />}
                      />
                      <StatCard
                        label="AI Conversations"
                        value={profile.analytics?.chats || 0}
                        icon={<MessageSquare size={18} />}
                      />
                      <StatCard
                        label="Messages Exchanged"
                        value={profile.analytics?.messages || 0}
                        icon={<TrendingUp size={18} />}
                      />
                      <StatCard
                        label="Leads Captured"
                        value={leads.length}
                        icon={<Users size={18} />}
                      />
                    </div>

                    <Card>
                      <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
                      <div className="h-64 flex items-center justify-center text-white/30">
                        <p>Charts coming soon...</p>
                      </div>
                    </Card>
                  </>
                )}
              </motion.div>
            )}

            {/* ─── Leads Tab ─────────────────────────────────────────────────── */}
            {activeTab === 'leads' && (
              <motion.div
                key="leads"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white">
                  Leads ({leads.length})
                </h3>

                {leads.map((lead) => (
                  <Card key={lead.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                            style={{ background: `${tc}20`, color: tc }}
                          >
                            {(lead.name || lead.phone)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{lead.name || 'Anonymous'}</p>
                            <p className="text-sm text-white/50">{lead.phone}</p>
                          </div>
                        </div>
                        {lead.message && (
                          <p className="text-sm text-white/60 mt-3 bg-white/5 p-3 rounded-lg">
                            "{lead.message.slice(0, 100)}{lead.message.length > 100 ? '...' : ''}"
                          </p>
                        )}
                      </div>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#3A86FF] hover:underline"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </Card>
                ))}

                {leads.length === 0 && (
                  <Card className="text-center py-12">
                    <Users size={48} className="mx-auto text-white/20 mb-4" />
                    <p className="text-white/50">No leads yet</p>
                    <p className="text-white/30 text-sm mt-2">
                      Leads appear when visitors share their contact info
                    </p>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
    </>
  );
}
