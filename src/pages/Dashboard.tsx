import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Link as LinkIcon, Sparkles, Save, Plus, Trash2,
  CheckCircle2, AlertCircle, Image as ImageIcon, Video, Wand2,
  Mail, Eye, MessageCircle, ExternalLink, Copy, Reply,
  TrendingUp, Heart, Layers, ShoppingBag, CreditCard, Package,
  Phone, MessageSquare, Zap, Star, Crown, ChevronRight, Send
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  UserProfile, UserLink, QAPair, ContactMessage,
  Service, ProfileMode, NFCProductType, NFCOrder
} from '../types';
import { GoogleGenAI } from '@google/genai';
import AvatarUpload from '../components/AvatarUpload';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROFILE_MODES: { id: ProfileMode; emoji: string; label: string; desc: string; color: string }[] = [
  {
    id: 'ai', emoji: '🤖', label: 'AI Mode',
    desc: 'Let an AI twin answer questions 24/7. Best for personal brand & creators.',
    color: '#3A86FF'
  },
  {
    id: 'landing', emoji: '🌐', label: 'Landing Mode',
    desc: 'Clean hero page with services and links. Fast and minimal.',
    color: '#10B981'
  },
  {
    id: 'sales', emoji: '💰', label: 'Sales Mode',
    desc: 'Service offer cards with prices and CTAs. Turn visitors into clients.',
    color: '#F59E0B'
  },
];

const PLANS = [
  {
    id: 'basic', name: 'Basic', emoji: '⚡', type: 'One-time',
    price: '$15', note: 'One-time payment',
    color: '#A855F7',
    features: ['Landing Mode Profile', 'Up to 3 Services', 'Custom Links', 'Basic Themes', 'Contact Form'],
    cta: 'Get Basic', popular: false
  },
  {
    id: 'pro', name: 'Pro', emoji: '🔥', type: 'Monthly',
    price: '$5/mo', note: 'or $50/year',
    color: '#00C6FF',
    features: ['Everything in Basic', 'AI Mode (Chat Twin)', 'Unlimited Services', 'Chat Customization', 'Premium Themes', 'Analytics Dashboard'],
    cta: 'Go Pro', popular: true
  },
  {
    id: 'elite', name: 'Elite', emoji: '👑', type: 'Monthly',
    price: '$10/mo', note: 'Full power',
    color: '#F59E0B',
    features: ['Everything in Pro', 'Sales Mode', 'Full Gemini AI Integration', 'Advanced Analytics', 'NFC Priority Shipping', 'Priority Support'],
    cta: 'Go Elite', popular: false
  },
];

const NFC_PRODUCTS = [
  { type: 'card' as NFCProductType, name: 'NFC Card', emoji: '💳', desc: 'Premium smart business card', price: '$12', note: 'Most Popular' },
  { type: 'keychain' as NFCProductType, name: 'NFC Keychain', emoji: '🔑', desc: 'Carry your digital profile everywhere', price: '$10', note: '' },
  { type: 'bracelet' as NFCProductType, name: 'NFC Bracelet', emoji: '⌚', desc: 'Stylish wearable NFC bracelet', price: '$9', note: '' },
  { type: 'sticker' as NFCProductType, name: 'NFC Sticker', emoji: '⬡', desc: 'Stick it anywhere — laptop, notebook…', price: '$6', note: 'Best Value' },
];

// ─── Component ───────────────────────────────────────────────────────────────

type TabId = 'profile' | 'links' | 'services' | 'ai' | 'studio' | 'messages' | 'favorites' | 'plans';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Messages
  const [receivedMessages, setReceivedMessages] = useState<ContactMessage[]>([]);

  // Studio
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoStatus, setVideoStatus] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [favoriteProfiles, setFavoriteProfiles] = useState<UserProfile[]>([]);

  // NFC Orders
  const [selectedNFC, setSelectedNFC] = useState<NFCProductType | null>(null);
  const [nfcForm, setNfcForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [isSubmittingNFC, setIsSubmittingNFC] = useState(false);
  const [nfcSubmitted, setNfcSubmitted] = useState(false);

  // ─── Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Dashboard | UAi';
    if (profile) {
      setFormData(profile);
    } else if (user) {
      setFormData({
        uid: user.uid, displayName: user.displayName || '',
        avatarUrl: user.photoURL || '', username: '',
        bio: '', links: [], qaPairs: [], aiPersona: '',
        featuredVideoUrl: '', services: [], mode: 'ai', plan: 'free'
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase.from('messages').select('*')
        .eq('profile_id', user.id).order('created_at', { ascending: false });
      if (!error) setReceivedMessages(data as any[]);
    };
    fetchMessages();

    const fetchFavorites = async () => {
      const { data: likes } = await supabase.from('likes').select('profile_id').eq('user_id', user.id);
      if (likes?.length) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', likes.map(l => l.profile_id));
        if (profiles) setFavoriteProfiles(profiles.map(p => ({
          uid: p.id, username: p.username, displayName: p.display_name,
          avatarUrl: p.avatar_url, bio: p.bio, themeColor: p.theme_color
        } as UserProfile)));
      }
    };
    fetchFavorites();

    const channel = supabase.channel(`messages:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `profile_id=eq.${user.id}` }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true); setSaveStatus('idle');
    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: formData.username?.toLowerCase(),
        display_name: formData.displayName,
        bio: formData.bio,
        about_me: formData.aboutMe,
        avatar_url: formData.avatarUrl,
        avatar_source: formData.avatarSource,
        theme_color: formData.themeColor,
        ai_persona: formData.aiPersona,
        featured_video_url: formData.featuredVideoUrl,
        analytics: formData.analytics,
        links: formData.links,
        qa_pairs: formData.qaPairs,
        services: formData.services,
        tags: formData.tags,
        is_private: formData.isPrivate,
        mode: formData.mode || 'ai',
        plan: formData.plan || 'free',
        whatsapp: formData.whatsapp,
        phone: formData.phone,
      });
      if (profileError) throw profileError;
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save Error:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('messages').delete().eq('id', id);
    setReceivedMessages(prev => prev.filter((m: any) => m.id !== id));
  };

  const generateAvatar = async () => {
    if (!imagePrompt) return;
    setIsGeneratingImage(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview', contents: imagePrompt,
        config: { imageConfig: { aspectRatio: '1:1' } }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        const url = `data:image/png;base64,${part.inlineData.data}`;
        setFormData(f => ({ ...f, avatarUrl: url, avatarSource: 'upload' }));
        setGeneratedImages(prev => [url, ...prev]);
      }
    } catch (err) { console.error('Image Gen Error:', err); }
    finally { setIsGeneratingImage(false); }
  };

  const generateVideo = async () => {
    if (!videoPrompt) return;
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) { await window.aistudio.openSelectKey(); return; }
    }
    setIsGeneratingVideo(true); setVideoStatus('Initializing generation...');
    try {
      const liveAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      let operation = await liveAi.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview', prompt: videoPrompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      while (!operation.done) {
        setVideoStatus('Generating video (may take a few minutes)…');
        await new Promise(r => setTimeout(r, 10000));
        operation = await liveAi.operations.getVideosOperation({ operation });
      }
      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) setFormData(f => ({ ...f, featuredVideoUrl: uri }));
    } catch (err) { console.error('Video Gen Error:', err); }
    finally { setIsGeneratingVideo(false); setVideoStatus(''); }
  };

  const generatePersona = async () => {
    if (!formData.displayName) return;
    setIsGeneratingPersona(true);
    try {
      const base = `Bio: ${formData.bio || 'N/A'}\nAbout: ${formData.aboutMe || 'N/A'}\nKnowledge: ${formData.qaPairs?.map(qa => `Q:${qa.question} A:${qa.answer}`).join(', ') || 'N/A'}`;
      const prompt = formData.aiPersona
        ? `Refine the AI persona for ${formData.displayName}.\nCurrent: ${formData.aiPersona}\n${base}\nKeep under 150 words, written as instructions for an AI.`
        : `Create an AI persona for ${formData.displayName}.\n${base}\nDescribe tone, expertise, and how to handle unknown questions. Under 150 words, written as instructions.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (response.text) setFormData(f => ({ ...f, aiPersona: response.text!.trim() }));
    } catch (err) { console.error('Persona Gen Error:', err); }
    finally { setIsGeneratingPersona(false); }
  };

  // Links
  const addLink = () => setFormData(f => ({ ...f, links: [...(f.links || []), { title: '', url: '' }] }));
  const updateLink = (i: number, field: keyof UserLink, value: string) => {
    const links = [...(formData.links || [])];
    links[i] = { ...links[i], [field]: value };
    setFormData(f => ({ ...f, links }));
  };
  const removeLink = (i: number) => setFormData(f => ({ ...f, links: (f.links || []).filter((_, idx) => idx !== i) }));

  // Q&A
  const addQA = () => setFormData(f => ({ ...f, qaPairs: [...(f.qaPairs || []), { question: '', answer: '' }] }));
  const updateQA = (i: number, field: keyof QAPair, value: string) => {
    const qaPairs = [...(formData.qaPairs || [])];
    qaPairs[i] = { ...qaPairs[i], [field]: value };
    setFormData(f => ({ ...f, qaPairs }));
  };
  const removeQA = (i: number) => setFormData(f => ({ ...f, qaPairs: (f.qaPairs || []).filter((_, idx) => idx !== i) }));

  // Services
  const addService = () => setFormData(f => ({
    ...f, services: [...(f.services || []), { id: Date.now().toString(), title: '', description: '', price: '', ctaLabel: '', ctaType: 'order' }]
  }));
  const updateService = (i: number, field: keyof Service, value: any) => {
    const services = [...(formData.services || [])];
    services[i] = { ...services[i], [field]: value };
    setFormData(f => ({ ...f, services }));
  };
  const removeService = (i: number) => setFormData(f => ({ ...f, services: (f.services || []).filter((_, idx) => idx !== i) }));

  const copyProfileLink = () => {
    if (!profile?.username) return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${profile.username}`);
    alert('Profile link copied!');
  };

  const handleNFCOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedNFC) return;
    setIsSubmittingNFC(true);
    try {
      const orderData: NFCOrder = {
        user_id: user.id, product_type: selectedNFC,
        name: nfcForm.name, phone: nfcForm.phone,
        address: nfcForm.address, notes: nfcForm.notes,
        status: 'pending', created_at: new Date().toISOString()
      };
      await supabase.from('nfc_orders').insert(orderData);
      setNfcSubmitted(true);
      setNfcForm({ name: '', phone: '', address: '', notes: '' });
      setTimeout(() => { setNfcSubmitted(false); setSelectedNFC(null); }, 5000);
    } catch (err) {
      console.error('NFC Order Error:', err);
    } finally {
      setIsSubmittingNFC(false);
    }
  };

  if (!user) return null;

  const tc = formData.themeColor || '#00C6FF';

  const TABS: { id: TabId; icon: any; label: string }[] = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'links', icon: LinkIcon, label: 'Links' },
    { id: 'services', icon: ShoppingBag, label: 'Services' },
    { id: 'ai', icon: Sparkles, label: 'AI Persona' },
    { id: 'studio', icon: Wand2, label: 'Studio' },
    { id: 'messages', icon: Mail, label: 'Messages' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'plans', icon: Crown, label: 'Plans & NFC' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-uai-gradient">Dashboard</h1>
          {profile?.username && (
            <p className="text-white/35 text-sm mt-1 font-mono">/{profile.username}</p>
          )}
        </div>
        <div className="flex gap-3">
          {profile?.username && (
            <button onClick={copyProfileLink}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all active:scale-95 text-sm">
              <Copy size={16} /> Share
            </button>
          )}
          {profile?.username && (
            <Link to={`/p/${profile.username}`} target="_blank"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm">
              <ExternalLink size={16} /> View Profile
            </Link>
          )}
          <button onClick={handleSave} disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 text-sm ${
              saveStatus === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/40'
              : saveStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-gradient-to-r from-brand-accent to-[#3A86FF] text-black'
            }`}>
            {isSaving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : saveStatus === 'success' ? <><CheckCircle2 size={16} /> Saved!</>
              : saveStatus === 'error' ? <><AlertCircle size={16} /> Error</>
              : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* ── Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 p-7 glass-card border border-white/10 rounded-[32px] space-y-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-brand-accent" size={18} />
            <h3 className="text-lg font-black tracking-tighter text-white">Profile Activity</h3>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-white/25 border border-white/10 px-2 py-0.5 rounded-full">7 Days</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Mon', views: Math.floor((profile?.analytics?.views || 0) * 0.1) },
                { name: 'Tue', views: Math.floor((profile?.analytics?.views || 0) * 0.15) },
                { name: 'Wed', views: Math.floor((profile?.analytics?.views || 0) * 0.12) },
                { name: 'Thu', views: Math.floor((profile?.analytics?.views || 0) * 0.2) },
                { name: 'Fri', views: Math.floor((profile?.analytics?.views || 0) * 0.18) },
                { name: 'Sat', views: Math.floor((profile?.analytics?.views || 0) * 0.25) },
                { name: 'Sun', views: Math.floor((profile?.analytics?.views || 0) * 0.3) },
              ]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={tc} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={tc} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: tc, fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="views" stroke={tc} strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Total Views', value: profile?.analytics?.views || 0, icon: Eye, color: '#00C6FF' },
            { label: 'AI Chats', value: profile?.analytics?.chats || 0, icon: MessageCircle, color: '#3A86FF' },
            { label: 'Messages', value: profile?.analytics?.messages || 0, icon: Mail, color: '#A855F7' },
          ].map(stat => (
            <div key={stat.label} className="p-6 glass-card border border-white/10 rounded-[24px] group hover:border-white/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={14} style={{ color: stat.color }} />
                <span className="text-xs font-bold uppercase tracking-widest text-white/35">{stat.label}</span>
              </div>
              <p className="text-3xl font-black tracking-tighter text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mode Selector ── */}
      <div className="p-7 glass-card border border-white/10 rounded-[32px] mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Layers size={18} className="text-brand-accent" />
            <h3 className="text-lg font-black tracking-tighter text-white">Profile Mode</h3>
          </div>
          <span className="text-[10px] text-white/25 font-bold uppercase tracking-widest">
            Active: <span className="text-white/60 capitalize">{formData.mode || 'ai'}</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PROFILE_MODES.map(mode => {
            const isActive = (formData.mode || 'ai') === mode.id;
            return (
              <button key={mode.id} onClick={() => setFormData(f => ({ ...f, mode: mode.id }))}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isActive ? 'border-white/30 bg-white/8' : 'border-white/8 bg-white/3 hover:border-white/15'
                }`}
                style={isActive ? { borderColor: `${mode.color}50`, background: `${mode.color}10`, boxShadow: `0 0 20px ${mode.color}15` } : {}}>
                {isActive && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: mode.color }} />
                )}
                <div className="text-2xl mb-2">{mode.emoji}</div>
                <div className="font-black text-white text-sm mb-1">{mode.label}</div>
                <div className="text-xs text-white/40 leading-relaxed">{mode.desc}</div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-white/25 mt-4">
          💡 Mode only affects how visitors see your public profile. Save to apply changes.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 p-1.5 bg-white/5 border border-white/8 rounded-2xl mb-8 overflow-x-auto scrollbar-thin">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm ${
              activeTab === tab.id
                ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/25'
                : 'text-white/45 hover:text-white/70 hover:bg-white/5'
            }`}>
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }} className="space-y-6">

          {/* ═══ PROFILE TAB ═══ */}
          {activeTab === 'profile' && (
            <div className="space-y-6 glass-card border border-white/10 p-8 rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/35 uppercase tracking-widest">Username</label>
                  <input type="text" value={formData.username || ''} disabled={!!profile}
                    onChange={e => setFormData(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                    placeholder="yourname"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors disabled:opacity-40 text-white text-sm" />
                  {!profile && <p className="text-xs text-white/30">Cannot be changed after saving.</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/35 uppercase tracking-widest">Display Name</label>
                  <input type="text" value={formData.displayName || ''}
                    onChange={e => setFormData(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                </div>
              </div>

              {/* Contact info (used by AI & Sales modes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/35 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageCircle size={12} className="text-green-400" /> WhatsApp Number
                  </label>
                  <input type="tel" value={formData.whatsapp || ''}
                    onChange={e => setFormData(f => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="+961 71 000 000"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                  <p className="text-xs text-white/25">Used for CTA buttons in AI & Sales modes.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/35 uppercase tracking-widest flex items-center gap-1.5">
                    <Phone size={12} className="text-brand-accent" /> Phone Number
                  </label>
                  <input type="tel" value={formData.phone || ''}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+961 71 000 000"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-white/35 uppercase tracking-widest">Theme Color</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Cyan', color: '#00C6FF' }, { name: 'Blue', color: '#0072FF' },
                    { name: 'Purple', color: '#8E2DE2' }, { name: 'Pink', color: '#FF0080' },
                    { name: 'Green', color: '#00FF87' }, { name: 'Orange', color: '#FF4B2B' },
                  ].map(theme => (
                    <button key={theme.color} onClick={() => setFormData(f => ({ ...f, themeColor: theme.color }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        (formData.themeColor === theme.color || (!formData.themeColor && theme.color === '#00C6FF'))
                          ? 'border-white/30 bg-white/10' : 'border-white/8 bg-white/5 hover:border-white/15'
                      }`}>
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.color }} />
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/35 uppercase tracking-widest">Bio (Short)</label>
                <textarea value={formData.bio || ''} onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell the world who you are…" rows={2}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors resize-none text-white text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/35 uppercase tracking-widest">About Me (Detailed)</label>
                <textarea value={formData.aboutMe || ''} onChange={e => setFormData(f => ({ ...f, aboutMe: e.target.value }))}
                  placeholder="Share your story, journey, and what makes you unique…" rows={5}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors resize-none text-white text-sm" />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-white/35 uppercase tracking-widest">Profile Avatar</label>
                <AvatarUpload uid={user?.id || ''} displayName={formData.displayName || 'User'}
                  currentUrl={formData.avatarUrl} currentSource={formData.avatarSource}
                  themeColor={formData.themeColor}
                  onUpdate={(url, source) => setFormData(f => ({ ...f, avatarUrl: url, avatarSource: source }))} />
              </div>

              <div className="pt-4 border-t border-white/8 space-y-5">
                <h3 className="text-base font-black text-brand-accent">Privacy & Discovery</h3>
                <div className="flex items-center justify-between p-5 glass-card border border-white/8 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-white text-sm">Private Profile</h4>
                    <p className="text-xs text-white/35 mt-0.5">Hide from Explore page.</p>
                  </div>
                  <button onClick={() => setFormData(f => ({ ...f, isPrivate: !f.isPrivate }))}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all ${formData.isPrivate ? 'bg-brand-accent' : 'bg-white/10'}`}>
                    <motion.div animate={{ x: formData.isPrivate ? 24 : 2 }} className="w-5 h-5 bg-white rounded-full shadow" />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-white/35 uppercase tracking-widest">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags?.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1 px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-xs font-bold border border-brand-accent/20">
                        {tag}
                        <button onClick={() => setFormData(f => ({ ...f, tags: f.tags?.filter((_, idx) => idx !== i) }))}>
                          <Trash2 size={10} className="hover:text-red-400 transition-colors" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input type="text" placeholder="Press Enter to add tag (e.g. Design, AI, Freelance)"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !formData.tags?.includes(val)) {
                          setFormData(f => ({ ...f, tags: [...(f.tags || []), val] }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* ═══ LINKS TAB ═══ */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              {formData.links?.map((link, i) => (
                <div key={i} className="flex gap-4 p-6 glass-card border border-white/10 rounded-2xl items-start">
                  <div className="flex-1 space-y-3">
                    <input type="text" value={link.title} onChange={e => updateLink(i, 'title', e.target.value)}
                      placeholder="Link Title (e.g. Instagram)"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                    <input type="url" value={link.url} onChange={e => updateLink(i, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                  </div>
                  <button onClick={() => removeLink(i)} className="p-2.5 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors mt-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button onClick={addLink}
                className="w-full flex items-center justify-center gap-2 p-5 border-2 border-dashed border-white/10 rounded-2xl text-white/35 hover:text-brand-accent hover:border-brand-accent/25 transition-all text-sm font-bold">
                <Plus size={18} /> Add New Link
              </button>
            </div>
          )}

          {/* ═══ SERVICES TAB ═══ */}
          {activeTab === 'services' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Services</h3>
                  <p className="text-xs text-white/35 mt-0.5">Shown in Landing & Sales modes. Used for AI mode CTAs.</p>
                </div>
                <span className="text-xs font-bold text-white/25 border border-white/10 px-2.5 py-1 rounded-full">
                  {formData.services?.length || 0} services
                </span>
              </div>

              {formData.services?.map((service, i) => (
                <div key={service.id} className="p-6 glass-card border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Service #{i + 1}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateService(i, 'featured', !service.featured)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                          service.featured ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' : 'border-white/10 bg-white/5 text-white/30 hover:border-yellow-500/20'
                        }`}>
                        <Star size={10} fill={service.featured ? 'currentColor' : 'none'} />
                        {service.featured ? 'Featured' : 'Feature'}
                      </button>
                      <button onClick={() => removeService(i)} className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={service.title} onChange={e => updateService(i, 'title', e.target.value)}
                      placeholder="Service Title"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm font-bold" />
                    <input type="text" value={service.price || ''} onChange={e => updateService(i, 'price', e.target.value)}
                      placeholder="Price (e.g. $50, Free, Starting at $20)"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                  </div>
                  <textarea value={service.description} onChange={e => updateService(i, 'description', e.target.value)}
                    placeholder="Describe this service…" rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors resize-none text-white text-sm" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-white/30 font-bold uppercase tracking-widest">CTA Type</label>
                      <select value={service.ctaType || 'order'} onChange={e => updateService(i, 'ctaType', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none text-white text-sm appearance-none">
                        <option value="order">Order Now</option>
                        <option value="book">Book Now</option>
                        <option value="contact">Contact</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/30 font-bold uppercase tracking-widest">Button Label (optional)</label>
                      <input type="text" value={service.ctaLabel || ''} onChange={e => updateService(i, 'ctaLabel', e.target.value)}
                        placeholder="e.g. Get Started"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/30 font-bold uppercase tracking-widest">CTA Link (optional)</label>
                      <input type="url" value={service.ctaLink || ''} onChange={e => updateService(i, 'ctaLink', e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addService}
                className="w-full flex items-center justify-center gap-2 p-5 border-2 border-dashed border-white/10 rounded-2xl text-white/35 hover:text-brand-accent hover:border-brand-accent/25 transition-all text-sm font-bold">
                <Plus size={18} /> Add New Service
              </button>
            </div>
          )}

          {/* ═══ AI PERSONA TAB ═══ */}
          {activeTab === 'ai' && (
            <div className="space-y-8 glass-card border border-white/10 p-8 rounded-3xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/35 uppercase tracking-widest">AI Persona Instructions</label>
                  <button onClick={generatePersona}
                    disabled={isGeneratingPersona || (!formData.bio && !formData.aboutMe && !formData.qaPairs?.length)}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:text-white transition-colors disabled:opacity-40">
                    {isGeneratingPersona ? <div className="w-3 h-3 border border-brand-accent border-t-transparent rounded-full animate-spin" /> : <Sparkles size={13} />}
                    {formData.aiPersona ? 'Refine' : 'Auto-Generate'}
                  </button>
                </div>
                <textarea value={formData.aiPersona || ''} onChange={e => setFormData(f => ({ ...f, aiPersona: e.target.value }))}
                  placeholder="e.g. You are a professional UX designer who is helpful and concise. You speak about design, tech, and creativity."
                  rows={4}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors resize-none text-white text-sm" />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-white/35 uppercase tracking-widest block">Knowledge Base (Q&A)</label>
                {formData.qaPairs?.map((qa, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-white/3 border border-white/8 rounded-2xl items-start">
                    <div className="flex-1 space-y-3">
                      <input type="text" value={qa.question} onChange={e => updateQA(i, 'question', e.target.value)}
                        placeholder="Question (e.g. What is your rate?)"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm font-bold" />
                      <textarea value={qa.answer} onChange={e => updateQA(i, 'answer', e.target.value)}
                        placeholder="Answer…" rows={2}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors resize-none text-white text-sm" />
                    </div>
                    <button onClick={() => removeQA(i)} className="p-2.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors mt-1">
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
                <button onClick={addQA}
                  className="w-full flex items-center justify-center gap-2 p-5 border-2 border-dashed border-white/10 rounded-2xl text-white/35 hover:text-brand-accent hover:border-brand-accent/25 transition-all text-sm font-bold">
                  <Plus size={18} /> Add Knowledge Entry
                </button>
              </div>
            </div>
          )}

          {/* ═══ STUDIO TAB ═══ */}
          {activeTab === 'studio' && (
            <div className="space-y-10">
              {/* Avatar Generator */}
              <div className="p-8 glass-card border border-white/10 rounded-3xl space-y-5">
                <div className="flex items-center gap-3">
                  <ImageIcon className="text-brand-accent" size={22} />
                  <h3 className="text-xl font-black text-uai-gradient">Avatar Generator</h3>
                </div>
                <p className="text-sm text-white/45">Generate a professional avatar using AI.</p>
                <div className="flex gap-3">
                  <input type="text" value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                    placeholder="A professional headshot of a creative developer…"
                    className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                  <button onClick={generateAvatar} disabled={isGeneratingImage || !imagePrompt}
                    className="px-6 py-3 bg-brand-accent text-black font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-40 text-sm">
                    {isGeneratingImage ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Video Generator */}
              <div className="p-8 glass-card border border-white/10 rounded-3xl space-y-5">
                <div className="flex items-center gap-3">
                  <Video className="text-brand-accent" size={22} />
                  <h3 className="text-xl font-black text-uai-gradient">Video Generator (Veo)</h3>
                </div>
                <div className="flex gap-3">
                  <input type="text" value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                    placeholder="A neon hologram in a futuristic city…"
                    className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                  <button onClick={generateVideo} disabled={isGeneratingVideo || !videoPrompt}
                    className="px-6 py-3 bg-brand-accent text-black font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-40 text-sm">
                    {isGeneratingVideo ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Generate'}
                  </button>
                </div>
                {videoStatus && <p className="text-xs text-brand-accent animate-pulse">{videoStatus}</p>}
                {formData.featuredVideoUrl && (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                    <video src={formData.featuredVideoUrl} controls className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Gallery */}
              {generatedImages.length > 0 && (
                <div className="p-8 glass-card border border-white/10 rounded-3xl space-y-5">
                  <h3 className="text-xl font-black text-uai-gradient">Studio Gallery</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {generatedImages.map((img, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                        <img src={img} alt={`Generated ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setFormData(f => ({ ...f, avatarUrl: img, avatarSource: 'upload' }))}
                            className="px-3 py-1.5 bg-brand-accent text-black rounded-lg font-bold text-xs">
                            Use as Avatar
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ MESSAGES TAB ═══ */}
          {activeTab === 'messages' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Mail className="text-brand-accent" size={20} />
                <h3 className="text-xl font-black text-uai-gradient">Inbox</h3>
                <span className="ml-auto text-xs font-bold border border-white/10 px-2 py-0.5 rounded-full text-white/35">
                  {receivedMessages.length} messages
                </span>
              </div>
              {receivedMessages.length === 0 ? (
                <div className="p-12 text-center glass-card border border-white/10 rounded-3xl">
                  <p className="text-white/30 text-sm">No messages yet. Share your profile to start receiving them!</p>
                </div>
              ) : (
                receivedMessages.map((msg: any) => (
                  <div key={msg.id} className="p-6 glass-card border border-white/10 rounded-3xl space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white">{msg.name || msg.fromName}</h4>
                        <p className="text-xs text-white/35">{msg.email || msg.fromEmail}</p>
                        {msg.subject && <p className="text-xs font-bold text-white/50 mt-1 uppercase tracking-wider">Re: {msg.subject}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-white/20">{new Date(msg.created_at || msg.createdAt).toLocaleDateString()}</span>
                        <a href={`mailto:${msg.email || msg.fromEmail}?subject=Re: ${msg.subject || 'Your message'}`}
                          className="p-2 text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors" title="Reply">
                          <Reply size={16} />
                        </a>
                        <button onClick={() => deleteMessage(msg.id)} className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed bg-white/3 p-4 rounded-xl border border-white/5">
                      {msg.content || msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ FAVORITES TAB ═══ */}
          {activeTab === 'favorites' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Heart className="text-red-400" size={20} />
                <h3 className="text-xl font-black text-uai-gradient">Favorite Profiles</h3>
              </div>
              {favoriteProfiles.length === 0 ? (
                <div className="p-12 text-center glass-card border border-white/10 rounded-3xl">
                  <p className="text-white/30 text-sm">No favorites yet.</p>
                  <Link to="/explore" className="inline-block mt-3 text-brand-accent font-bold text-sm hover:underline">Explore Profiles →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoriteProfiles.map(fav => (
                    <Link key={fav.uid} to={`/${fav.username}`}
                      className="flex items-center gap-4 p-5 glass-card border border-white/10 rounded-2xl hover:border-white/20 transition-all group">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                        {fav.avatarUrl
                          ? <img src={fav.avatarUrl} alt={fav.displayName} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-white/5 flex items-center justify-center font-bold text-xl text-white/40">{fav.displayName[0]}</div>}
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-brand-accent transition-colors">{fav.displayName}</h4>
                        <p className="text-xs text-white/35">@{fav.username}</p>
                      </div>
                      <ChevronRight size={16} className="ml-auto text-white/20 group-hover:text-white/50 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ PLANS & NFC TAB ═══ */}
          {activeTab === 'plans' && (
            <div className="space-y-12">

              {/* Current Plan Badge */}
              <div className="flex items-center gap-4 p-5 glass-card border border-white/10 rounded-2xl">
                <div className="p-2 rounded-xl bg-brand-accent/15">
                  <Crown size={20} className="text-brand-accent" />
                </div>
                <div>
                  <p className="text-xs text-white/35 uppercase tracking-widest font-bold">Current Plan</p>
                  <p className="text-lg font-black text-white capitalize">{formData.plan || 'Free'}</p>
                </div>
                {formData.plan && formData.plan !== 'free' && (
                  <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-brand-accent/15 text-brand-accent border border-brand-accent/20">
                    Active
                  </span>
                )}
              </div>

              {/* Plan Cards */}
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-white mb-2">Choose Your Plan</h3>
                <p className="text-sm text-white/35 mb-7">Prices optimized for the Lebanese market. 💙</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLANS.map(plan => (
                    <div key={plan.id}
                      className={`relative flex flex-col p-7 glass-card border rounded-3xl overflow-hidden transition-all ${
                        plan.popular ? '' : 'border-white/10'
                      }`}
                      style={plan.popular ? { borderColor: `${plan.color}40`, boxShadow: `0 0 30px ${plan.color}12` } : {}}>

                      {plan.popular && (
                        <div className="absolute top-4 right-4">
                          <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest text-black"
                            style={{ background: plan.color }}>
                            Popular
                          </span>
                        </div>
                      )}

                      <div className="text-3xl mb-3">{plan.emoji}</div>
                      <h4 className="text-xl font-black text-white mb-1">{plan.name}</h4>
                      <div className="mb-1">
                        <span className="text-3xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                      </div>
                      <p className="text-xs text-white/30 mb-5">{plan.note}</p>

                      <ul className="space-y-2.5 flex-1 mb-6">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                            <CheckCircle2 size={13} style={{ color: plan.color }} className="shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <a href={`https://wa.me/96100000000?text=${encodeURIComponent(`Hi! I want to upgrade to the ${plan.name} plan on UAi.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95"
                        style={{
                          background: (formData.plan === plan.id) ? `${plan.color}25` : `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)`,
                          color: (formData.plan === plan.id) ? plan.color : '#000',
                          border: (formData.plan === plan.id) ? `1px solid ${plan.color}50` : 'none'
                        }}>
                        {formData.plan === plan.id ? '✓ Current Plan' : plan.cta}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* NFC Products */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Package size={22} className="text-brand-accent" />
                  <h3 className="text-2xl font-black tracking-tighter text-white">NFC Physical Products</h3>
                </div>
                <p className="text-sm text-white/35 mb-7">
                  Tap your product → your UAi profile opens instantly. No app needed. 🇱🇧 Delivered in Lebanon.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                  {NFC_PRODUCTS.map(product => (
                    <button key={product.type} onClick={() => setSelectedNFC(selectedNFC === product.type ? null : product.type)}
                      className={`relative flex flex-col items-center text-center p-6 glass-card border rounded-2xl transition-all nfc-card-hover ${
                        selectedNFC === product.type ? '' : 'border-white/10 hover:border-white/20'
                      }`}
                      style={selectedNFC === product.type ? {
                        borderColor: `${tc}50`, background: `${tc}10`,
                        boxShadow: `0 0 25px ${tc}18`
                      } : {}}>
                      {product.note && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full text-black whitespace-nowrap"
                          style={{ background: tc }}>
                          {product.note}
                        </span>
                      )}
                      <div className="text-4xl mb-3">{product.emoji}</div>
                      <h4 className="font-black text-white text-sm mb-1">{product.name}</h4>
                      <p className="text-xs text-white/40 mb-3 leading-tight">{product.desc}</p>
                      <span className="text-lg font-black" style={{ color: selectedNFC === product.type ? tc : '#ffffff80' }}>
                        {product.price}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Order Form */}
                <AnimatePresence>
                  {selectedNFC && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="p-8 glass-card border rounded-3xl space-y-5"
                      style={{ borderColor: `${tc}25` }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{NFC_PRODUCTS.find(p => p.type === selectedNFC)?.emoji}</span>
                        <div>
                          <h4 className="font-black text-white">Order: {NFC_PRODUCTS.find(p => p.type === selectedNFC)?.name}</h4>
                          <p className="text-xs text-white/35">
                            Your profile link <span className="font-mono" style={{ color: tc }}>/{profile?.username || 'yourname'}</span> will be programmed into the chip.
                          </p>
                        </div>
                      </div>

                      {nfcSubmitted ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-2">
                          <CheckCircle2 size={32} className="text-green-400 mx-auto" />
                          <h4 className="font-black text-white">Order Submitted! 🎉</h4>
                          <p className="text-sm text-white/50">We'll contact you on WhatsApp/phone to confirm delivery details.</p>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleNFCOrder} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Full Name</label>
                              <input type="text" required value={nfcForm.name} onChange={e => setNfcForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Your full name"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Phone / WhatsApp</label>
                              <input type="tel" required value={nfcForm.phone} onChange={e => setNfcForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="+961 71 000 000"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Delivery Address (Lebanon)</label>
                            <input type="text" required value={nfcForm.address} onChange={e => setNfcForm(f => ({ ...f, address: e.target.value }))}
                              placeholder="City, area, building…"
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Notes (optional)</label>
                            <input type="text" value={nfcForm.notes} onChange={e => setNfcForm(f => ({ ...f, notes: e.target.value }))}
                              placeholder="Any special requests…"
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/25 transition-colors text-white text-sm" />
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div>
                              <p className="text-xs text-white/30">Total: <span className="font-black text-white">{NFC_PRODUCTS.find(p => p.type === selectedNFC)?.price}</span></p>
                              <p className="text-xs text-white/25">Cash on delivery. Contact to confirm payment.</p>
                            </div>
                            <button type="submit" disabled={isSubmittingNFC}
                              className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-black text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                              style={{ background: `linear-gradient(135deg, ${tc}, #3A86FF)` }}>
                              {isSubmittingNFC
                                ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                : <><Package size={16} /> Place Order</>}
                            </button>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 p-5 bg-white/3 border border-white/8 rounded-2xl">
                  <p className="text-xs text-white/30 leading-relaxed">
                    🔒 <strong className="text-white/50">How it works:</strong> After ordering, we program your UAi profile link into the NFC chip.
                    Anyone who taps the product with their phone will instantly open your profile.
                    Delivery within Lebanon. Questions? Message us on WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
