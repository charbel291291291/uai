import { useState, useEffect, useRef, FormEvent } from 'react';
import globalRateLimiter, { RateLimitPresets } from '../utils/rateLimiter';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { UserProfile, Message, Service, Testimonial } from '../types';
import type { Lead } from '../types';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../App';
import Markdown from 'react-markdown';
import {
  Send, Sparkles, Heart, MessageCircle, Phone, Mail,
  ExternalLink, Star, Zap, ArrowRight, CheckCircle2,
  User as UserIcon, Briefcase, Globe
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SEO } from '../components/SEO';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// ─── Animation Variants ─────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// ─── Profile Page Component ─────────────────────────────────────────────────
export default function Profile() {
  const { user } = useAuth();
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Like state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Lead capture
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadPhone, setLeadPhone] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [userMsgCount, setUserMsgCount] = useState(0);

  // Contact form
  const [contactOpen, setContactOpen] = useState(false);

  // ─── Fetch Profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error || !data) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        const mappedProfile: UserProfile = {
          uid: data.id,
          username: data.username,
          displayName: data.display_name,
          bio: data.bio,
          aboutMe: data.about_me,
          avatarUrl: data.avatar_url,
          themeColor: data.theme_color || '#3A86FF',
          links: data.links || [],
          services: data.services || [],
          testimonials: data.testimonials || [],
          qaPairs: data.qa_pairs || [],
          tone: data.tone,
          goal: data.goal,
          whatsapp: data.whatsapp,
          phone: data.phone,
          mode: data.mode || 'ai',
          analytics: data.analytics || { views: 0, chats: 0, messages: 0, leads: 0 },
        };

        setProfile(mappedProfile);
        document.title = `${mappedProfile.displayName} | UAi`;

        // Init chat
        setMessages([{
          id: 'welcome',
          text: `Hi! I'm ${mappedProfile.displayName}'s AI. Ask me anything!`,
          sender: 'ai',
          timestamp: Date.now(),
        }]);

        // Fetch likes
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', mappedProfile.uid);
        setLikeCount(count || 0);

        // Track view — atomic SQL increment avoids read-modify-write race condition
        const sessionKey = `viewed_${mappedProfile.uid}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, '1');
          await supabase.rpc('increment_profile_views', { profile_id: mappedProfile.uid });
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Restore tab title when navigating away from this profile
    return () => { document.title = 'UAi'; };
  }, [username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!user || !profile) return;
    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('profile_id', profile.uid);
        setIsLiked(false);
        setLikeCount((p) => Math.max(0, p - 1));
      } else {
        await supabase.from('likes').insert({ user_id: user.id, profile_id: profile.uid });
        setIsLiked(true);
        setLikeCount((p) => p + 1);
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || !profile) return;

    // Client-side rate limit: 10 AI messages per minute per visitor session
    const visitorKey = `ai_chat:${profile.uid}`;
    if (!globalRateLimiter.isAllowed(visitorKey, RateLimitPresets.aiChat)) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        text: "You're sending messages too quickly. Please wait a moment before continuing.",
        sender: 'ai' as const,
        timestamp: Date.now(),
      }]);
      return;
    }

    if (!text) setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      text: msgText,
      sender: 'user',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const newCount = userMsgCount + 1;
    setUserMsgCount(newCount);

    // Show lead capture after 3 messages
    if (newCount >= 3 && !leadCaptured) {
      setTimeout(() => setShowLeadCapture(true), 1500);
    }

    try {
      // Build context
      const context = messages.slice(-6).map((m) =>
        `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`
      ).join('\n');

      const prompt = `You are ${profile.displayName}'s AI assistant. Be helpful, concise (2-3 sentences), and professional.

Profile: ${profile.bio || 'No bio'}
Services: ${profile.services?.map((s) => s.title).join(', ') || 'None'}

Conversation:
${context}

User: ${msgText}
AI:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const aiText = response.text?.trim() || "I'm not sure how to answer that.";

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: Date.now(),
      }]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble right now. Please try again!",
        sender: 'ai',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !leadPhone.trim()) return;

    try {
      await supabase.from('leads').insert({
        profile_id: profile.uid,
        name: leadName.trim() || undefined,
        phone: leadPhone.trim(),
        message: messages.slice(-4).filter((m) => m.sender === 'user').map((m) => m.text).join(' | '),
      });
      setLeadCaptured(true);
      setShowLeadCapture(false);
    } catch (err) {
      console.error('Lead error:', err);
    }
  };

  // ─── Loading / Error States ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-12 h-12 border-2 border-[#3A86FF] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <p className="text-white/60 mb-8">{error || 'Profile not found'}</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const tc = profile.themeColor || '#3A86FF';
  const initials = profile.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const suggestions = profile.qaPairs?.slice(0, 3).map((qa) => qa.question) || [
    'What services do you offer?',
    'How can I work with you?',
    "What's your pricing?",
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <SEO
        title={profile?.displayName || profile?.username || 'Profile'}
        description={profile?.bio || `Connect with ${profile?.displayName || profile?.username} on UAi - Your Digital AI Twin`}
        type="profile"
        image={profile?.avatarUrl || '/og-image.jpg'}
      />
      <div className="min-h-screen pb-20">
      {/* ─── Back Button ── */}
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 px-6">
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-30 blur-[100px] pointer-events-none"
          style={{ background: tc }}
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center relative"
        >
          {/* Avatar */}
          <motion.div variants={fadeInUp} className="mb-6">
            <div
              className="w-28 h-28 mx-auto rounded-full p-1"
              style={{
                background: `linear-gradient(135deg, ${tc}, #3A86FF)`,
                boxShadow: `0 0 40px ${tc}40`,
              }}
            >
              <div className="w-full h-full rounded-full bg-[#020617] overflow-hidden flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">{initials}</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Name & Handle */}
          <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl font-bold text-white mb-2">
            {profile.displayName}
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-white/50 mb-4">
            @{profile.username}
          </motion.p>

          {/* Bio */}
          {profile.bio && (
            <motion.p variants={fadeInUp} className="text-lg text-white/70 max-w-xl mx-auto mb-8">
              {profile.bio}
            </motion.p>
          )}

          {/* Stats */}
          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.analytics?.views || 0}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Views</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.analytics?.chats || 0}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Chats</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{likeCount}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Likes</p>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-3">
            {profile.whatsapp && (
              <Button
                leftIcon={<MessageCircle size={18} />}
                onClick={() => window.open(`https://wa.me/${profile.whatsapp}`, '_blank')}
              >
                WhatsApp
              </Button>
            )}
            {profile.phone && (
              <Button
                variant="secondary"
                leftIcon={<Phone size={18} />}
                onClick={() => window.open(`tel:${profile.phone}`)}
              >
                Call
              </Button>
            )}
            <Button
              variant="ghost"
              leftIcon={<Heart size={18} className={isLiked ? 'fill-current text-red-400' : ''} />}
              onClick={handleLike}
            >
              {likeCount}
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Services Section ────────────────────────────────────────────────── */}
      {profile.services && profile.services.length > 0 && (
        <section className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Services</h2>
              <p className="text-white/50">What I can help you with</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {profile.services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${tc}20` }}
                      >
                        <Briefcase size={20} style={{ color: tc }} />
                      </div>
                      {service.featured && (
                        <Badge variant="default" size="sm">
                          <Star size={10} className="fill-current" /> Featured
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                    <p className="text-white/50 text-sm mb-4 flex-grow">{service.description}</p>
                    {service.price && (
                      <p className="text-xl font-bold mb-4" style={{ color: tc }}>
                        {service.price}
                      </p>
                    )}
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() =>
                        profile.whatsapp
                          ? window.open(
                              `https://wa.me/${profile.whatsapp}?text=Hi! I'm interested in: ${service.title}`,
                              '_blank'
                            )
                          : setContactOpen(true)
                      }
                    >
                      Get Started <ArrowRight size={16} />
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── AI Chat Section ─────────────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${tc}20` }}
              >
                <Sparkles size={20} style={{ color: tc }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chat with my AI</h2>
                <p className="text-sm text-white/50">Ask anything about my work</p>
              </div>
            </div>
          </motion.div>

          {/* Chat Container */}
          <Card className="overflow-hidden !p-0">
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#00C6FF] to-[#3A86FF] text-black font-medium'
                        : 'bg-white/5 text-white/90 border border-white/10'
                    }`}
                    style={
                      msg.sender === 'ai'
                        ? { boxShadow: `0 0 20px ${tc}10` }
                        : undefined
                    }
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-white/40"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Lead Capture */}
              <AnimatePresence>
                {showLeadCapture && !leadCaptured && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#3A86FF]/10 border border-[#3A86FF]/30 rounded-2xl p-4"
                  >
                    <p className="text-sm text-white mb-3">
                      Want {profile.displayName} to reach out to you?
                    </p>
                    <form onSubmit={handleLeadSubmit} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
                      />
                      <input
                        type="tel"
                        placeholder="Phone *"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        required
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
                      />
                      <Button size="sm" type="submit">
                        Send
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              {/* Suggestions */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendMessage(q)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  size="md"
                  className="!px-4"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </section>

      {/* ─── Testimonials Section ────────────────────────────────────────────── */}
      {profile.testimonials && profile.testimonials.length > 0 && (
        <section className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">What people say</h2>
              <p className="text-white/50">Trusted by clients worldwide</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {profile.testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card>
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          size={14}
                          className={starIdx < t.rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
                        />
                      ))}
                    </div>
                    <p className="text-white/80 text-sm mb-4 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: `${tc}30`, color: tc }}
                        >
                          {t.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white text-sm">{t.name}</p>
                        {t.role && <p className="text-white/40 text-xs">{t.role}</p>}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Links Section ───────────────────────────────────────────────────── */}
      {profile.links && profile.links.length > 0 && (
        <section className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Links</h2>
              <p className="text-white/50">Find me online</p>
            </motion.div>

            <div className="flex flex-wrap gap-3">
              {profile.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Globe size={16} />
                  <span className="font-medium">{link.title}</span>
                  <ExternalLink size={14} className="text-white/40" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/30 text-sm">
            Powered by <span className="text-gradient font-semibold">UAi</span>
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
