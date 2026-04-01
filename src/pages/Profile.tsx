import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { UserProfile, Message, Service } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink, Send, Sparkles, User as UserIcon,
  Mail, CheckCircle2, Heart, Phone, MessageCircle,
  ArrowRight, Zap, Star, Tag
} from 'lucide-react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../App';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function Profile() {
  const { user } = useAuth();
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  // Like state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // ─── Data Fetching ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username.toLowerCase())
          .single();

        if (error || !data) { setError('User not found'); return; }

        const mappedProfile: UserProfile = {
          uid: data.id,
          username: data.username,
          displayName: data.display_name,
          bio: data.bio,
          aboutMe: data.about_me,
          avatarUrl: data.avatar_url,
          avatarSource: data.avatar_source,
          themeColor: data.theme_color,
          aiPersona: data.ai_persona,
          featuredVideoUrl: data.featured_video_url,
          links: data.links || [],
          qaPairs: data.qa_pairs || [],
          services: data.services || [],
          analytics: data.analytics || { views: 0, chats: 0, messages: 0 },
          createdAt: data.created_at,
          isPrivate: data.is_private,
          mode: data.mode || 'ai',
          plan: data.plan || 'free',
          whatsapp: data.whatsapp,
          phone: data.phone,
          tags: data.tags || [],
        };

        const { data: { session } } = await supabase.auth.getSession();
        if (mappedProfile.isPrivate && session?.user?.id !== mappedProfile.uid) {
          setError('This profile is private');
          setLoading(false);
          return;
        }

        setProfile(mappedProfile);
        document.title = `${mappedProfile.displayName} (@${mappedProfile.username}) | UAi`;
        setMessages([{
          id: 'welcome',
          text: `Hi! I'm the AI version of ${mappedProfile.displayName}. Ask me anything!`,
          sender: 'ai',
          timestamp: Date.now()
        }]);

        const { count } = await supabase
          .from('likes').select('*', { count: 'exact', head: true })
          .eq('profile_id', mappedProfile.uid);
        setLikeCount(count || 0);

        if (session?.user) {
          const { data: likeData } = await supabase
            .from('likes').select('*')
            .eq('user_id', session.user.id).eq('profile_id', mappedProfile.uid).single();
          setIsLiked(!!likeData);
        }

        const newAnalytics = { ...mappedProfile.analytics, views: (mappedProfile.analytics?.views || 0) + 1 };
        await supabase.from('profiles').update({ analytics: newAnalytics }).eq('id', mappedProfile.uid);
      } catch (err) {
        console.error('Fetch Profile Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!user || !profile || isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('profile_id', profile.uid);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('likes').insert({ user_id: user.id, profile_id: profile.uid });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleSendMessage = async (msgText?: string) => {
    const text = msgText !== undefined ? msgText : input;
    if (!text.trim() || !profile) return;
    if (msgText === undefined) setInput('');

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const newAnalytics = { ...profile.analytics, chats: (profile.analytics?.chats || 0) + 1 };
    supabase.from('profiles').update({ analytics: newAnalytics }).eq('id', profile.uid);

    try {
      const context = messages.slice(-10).map(m => `${m.sender === 'user' ? 'User' : 'AI Twin'}: ${m.text}`).join('\n');
      const prompt = `
        You are the AI twin of ${profile.displayName}.
        Persona instructions: ${profile.aiPersona || 'Be helpful, friendly, and concise.'}
        Knowledge base:
        ${profile.qaPairs?.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}
        Recent conversation:
        ${context}
        Answer as ${profile.displayName}. Be concise and conversational.
        User: ${text}
        AI Twin:
      `;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: response.text || "I'm not sure how to answer that right now.",
        sender: 'ai',
        timestamp: Date.now()
      }]);
    } catch (err) {
      console.error('AI Error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactError(null);
    if (!profile) return;
    if (contactName.trim().length < 2) { setContactError('Name must be at least 2 characters.'); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(contactEmail)) { setContactError('Please enter a valid email address.'); return; }
    if (contactSubject.trim().length < 2) { setContactError('Subject must be at least 2 characters.'); return; }
    if (contactMessage.trim().length < 10) { setContactError('Message must be at least 10 characters.'); return; }

    setIsSendingContact(true);
    try {
      const { error } = await supabase.from('messages').insert({
        profile_id: profile.uid, name: contactName.trim(), email: contactEmail.trim(),
        content: contactMessage.trim(), created_at: new Date().toISOString()
      });
      if (error) throw error;
      const newAnalytics = { ...profile.analytics, messages: (profile.analytics?.messages || 0) + 1 };
      supabase.from('profiles').update({ analytics: newAnalytics }).eq('id', profile.uid);
      setContactSent(true);
      setContactName(''); setContactEmail(''); setContactSubject(''); setContactMessage('');
      setTimeout(() => setContactSent(false), 5000);
    } catch {
      setContactError('Failed to send message. Please try again.');
    } finally {
      setIsSendingContact(false);
    }
  };

  // ─── Loading / Error ───────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center">
      <h1 className="text-4xl font-black mb-4 text-uai-gradient">404</h1>
      <p className="text-white/60 mb-8">{error || 'Profile not found'}</p>
      <Link to="/" className="px-8 py-4 bg-brand-accent text-black font-bold rounded-2xl">Go Home</Link>
    </div>
  );

  const tc = profile.themeColor || '#00C6FF';
  const initials = profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const suggestions = [
    ...(profile.qaPairs?.slice(0, 3).map(qa => qa.question) || []),
    'How can I work with you?', 'What are your rates?'
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

  // ─── Shared Sub-Components ────────────────────────────────────────────
  const AvatarEl = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
    const sizeMap = { sm: 'w-14 h-14', md: 'w-24 h-24', lg: 'w-32 h-32', xl: 'w-40 h-40' };
    const textMap = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl', xl: 'text-4xl' };
    return (
      <div className={`${sizeMap[size]} rounded-3xl p-0.5 shrink-0`}
        style={{ background: `linear-gradient(135deg, ${tc}, #3A86FF)` }}>
        <div className="w-full h-full rounded-[calc(1.5rem-2px)] bg-[#020617] overflow-hidden flex items-center justify-center">
          {profile.avatarUrl && profile.avatarSource !== 'initials' ? (
            <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center font-black text-white ${textMap[size]}`}
              style={{ background: `linear-gradient(135deg, ${tc}80, #000)` }}>
              {initials}
            </div>
          )}
        </div>
      </div>
    );
  };

  const LikeBtn = () => (
    <button onClick={handleLike} disabled={!user || isLiking}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold transition-all disabled:opacity-50 ${
        isLiked ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
      }`}>
      <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-pulse' : ''} />
      {likeCount}
    </button>
  );

  const LinksEl = () => (
    <>
      {(profile.links?.length ?? 0) > 0 && (
        <div className="space-y-3">
          {profile.links!.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-5 glass-card border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group">
              <span className="font-bold text-white">{link.title}</span>
              <ExternalLink size={18} style={{ color: tc }} className="group-hover:translate-x-1 transition-transform" />
            </a>
          ))}
        </div>
      )}
    </>
  );

  const ServiceCTA = ({ service }: { service: Service }) => {
    const getHref = () => {
      if (service.ctaLink) return service.ctaLink;
      if (service.ctaType === 'whatsapp' && profile.whatsapp)
        return `https://wa.me/${profile.whatsapp}?text=Hi! I'm interested in: ${encodeURIComponent(service.title)}`;
      if (profile.whatsapp)
        return `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`Hi! I want to order: ${service.title}`)}`;
      return '#contact';
    };
    const label = service.ctaLabel || (service.ctaType === 'book' ? 'Book Now' : service.ctaType === 'contact' ? 'Contact' : 'Order Now');
    const href = getHref();
    const isExternal = href.startsWith('http');
    const btnClass = "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-black text-sm transition-all hover:brightness-110 active:scale-95";
    const btnStyle = { background: `linear-gradient(to right, ${tc}, #3A86FF)` };
    if (isExternal) return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={btnClass} style={btnStyle}>
        {label} <ArrowRight size={14} />
      </a>
    );
    return (
      <button onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })} className={btnClass} style={btnStyle}>
        {label} <ArrowRight size={14} />
      </button>
    );
  };

  const ContactFormEl = () => (
    <div ref={contactRef} className="p-8 glass-card border border-white/10 rounded-[40px] space-y-6"
      style={{ boxShadow: `0 0 30px ${tc}08` }}>
      <div className="flex items-center gap-3">
        <Mail size={22} style={{ color: tc }} />
        <h3 className="text-2xl font-black tracking-tighter text-white">Send a Message</h3>
      </div>
      <form onSubmit={handleContactSubmit} className="space-y-4">
        <AnimatePresence>
          {contactError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {contactError}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" required value={contactName} onChange={e => setContactName(e.target.value)}
            placeholder="Your Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none transition-colors text-white placeholder:text-white/25 focus:border-white/30" />
          <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)}
            placeholder="your@email.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none transition-colors text-white placeholder:text-white/25 focus:border-white/30" />
        </div>
        <input type="text" required value={contactSubject} onChange={e => setContactSubject(e.target.value)}
          placeholder="Subject" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none transition-colors text-white placeholder:text-white/25 focus:border-white/30" />
        <div className="relative">
          <textarea required minLength={10} value={contactMessage} onChange={e => setContactMessage(e.target.value)}
            placeholder="What's on your mind?" rows={4} maxLength={1000}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none transition-colors resize-none text-white placeholder:text-white/25 focus:border-white/30" />
          <span className="absolute bottom-3 right-4 text-[10px] font-mono text-white/20 pointer-events-none">
            {1000 - contactMessage.length}
          </span>
        </div>
        <button type="submit" disabled={isSendingContact || contactSent}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
            contactSent ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'text-black hover:brightness-110'
          }`}
          style={{ background: contactSent ? undefined : `linear-gradient(to right, ${tc}, #3A86FF)` }}>
          {isSendingContact ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            : contactSent ? <><CheckCircle2 size={18} /> Message Sent!</>
            : <><Send size={18} /> Send Message</>}
        </button>
      </form>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // ─── AI MODE (default) ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════
  if (!profile.mode || profile.mode === 'ai') return (
    <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
      style={{ '--theme-color': tc } as React.CSSProperties}>

      {/* ── Left: Profile Info ── */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 lg:sticky lg:top-32">
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            <AvatarEl size="md" />
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white">{profile.displayName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="font-bold text-sm" style={{ color: tc }}>@{profile.username}</p>
                <LikeBtn />
              </div>
            </div>
          </div>

          <p className="text-lg text-white/65 leading-relaxed">{profile.bio || 'No bio yet.'}</p>

          {/* Contact quick CTAs */}
          {(profile.whatsapp || profile.phone) && (
            <div className="flex flex-wrap gap-3">
              {profile.whatsapp && (
                <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-sm transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(to right, #25D366, #128C7E)', boxShadow: '0 0 15px #25D36635' }}>
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white/70 text-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <Phone size={15} /> Call Me
                </a>
              )}
            </div>
          )}

          <LinksEl />

          {profile.aboutMe && (
            <div className="space-y-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UserIcon size={18} style={{ color: tc }} /> About Me
              </h3>
              <div className="p-6 glass-card border border-white/10 rounded-2xl text-white/65 text-sm leading-relaxed">
                <Markdown>{profile.aboutMe}</Markdown>
              </div>
            </div>
          )}
        </div>

        <ContactFormEl />
      </motion.div>

      {/* ── Right: AI Chat ── */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="flex flex-col h-[75vh] lg:h-[85vh] glass-card border border-white/10 rounded-[40px] overflow-hidden"
        style={{ boxShadow: `0 0 40px ${tc}0a` }}>

        {/* Chat header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black"
              style={{ background: `linear-gradient(135deg, ${tc}, #3A86FF)` }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-black text-white text-sm">Ask My AI Twin</h3>
              <p className="text-xs flex items-center gap-1" style={{ color: tc }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: tc }} />
                Online
              </p>
            </div>
          </div>
          <span className="text-[10px] text-white/25 border border-white/10 px-2 py-1 rounded-full font-mono">Gemini AI</span>
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && suggestions.length > 0 && (
          <div className="p-4 border-b border-white/5 bg-black/20">
            <p className="text-[10px] text-white/25 mb-2 font-bold uppercase tracking-widest">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(q => (
                <button key={q} onClick={() => handleSendMessage(q)}
                  className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 hover:border-white/30 hover:text-white/80 transition-all font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <div key={msg.id}>
              <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'text-black font-semibold'
                    : 'bg-white/8 text-white/85 border border-white/5'
                }`} style={msg.sender === 'user' ? { background: `linear-gradient(135deg, ${tc}, #3A86FF)` } : undefined}>
                  {msg.text}
                </div>
              </div>

              {/* Post-answer CTA strip — shown after last AI response */}
              {msg.sender === 'ai' && idx === messages.length - 1 && messages.length > 1 &&
                (profile.whatsapp || profile.phone || (profile.links?.length ?? 0) > 0) && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2 mt-3 ml-1">
                  {profile.whatsapp && (
                    <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 border"
                      style={{ borderColor: `${tc}40`, background: `${tc}12`, color: tc }}>
                      <MessageCircle size={11} /> WhatsApp
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/55 transition-all hover:scale-105">
                      <Phone size={11} /> Call
                    </a>
                  )}
                  {profile.links?.[0] && (
                    <a href={profile.links[0].url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/55 transition-all hover:scale-105">
                      <ExternalLink size={11} /> {profile.links[0].title}
                    </a>
                  )}
                </motion.div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/8 border border-white/5 p-4 rounded-2xl flex gap-1.5">
                {[0, 0.18, 0.36].map((d, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: tc, animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
          className="p-5 bg-white/5 border-t border-white/10">
          <div className="relative">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full pl-5 pr-14 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-white/25 transition-colors text-white placeholder:text-white/25 text-sm" />
            <button type="submit" disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1.5 bottom-1.5 px-3.5 text-black rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${tc}, #3A86FF)` }}>
              <Send size={16} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // ─── LANDING MODE ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════
  if (profile.mode === 'landing') return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-16"
      style={{ '--theme-color': tc } as React.CSSProperties}>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-7">
        <div className="flex justify-center">
          <div className="relative">
            <AvatarEl size="xl" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-[#020617] flex items-center justify-center text-sm"
              style={{ background: `linear-gradient(135deg, ${tc}, #3A86FF)` }}>
              <Sparkles size={16} className="text-black" />
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-2">{profile.displayName}</h1>
          <p className="font-bold text-sm" style={{ color: tc }}>@{profile.username}</p>
        </div>
        <p className="text-lg text-white/65 max-w-xl mx-auto leading-relaxed">{profile.bio}</p>

        {/* Tags */}
        {(profile.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {profile.tags!.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border"
                style={{ borderColor: `${tc}40`, color: tc, background: `${tc}10` }}>
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {profile.whatsapp && (
            <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-full font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 0 25px #25D36640' }}>
              <MessageCircle size={20} /> WhatsApp Me
            </a>
          )}
          {profile.phone && (
            <a href={`tel:${profile.phone}`}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-black text-black transition-all hover:scale-105 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${tc}, #3A86FF)`, boxShadow: `0 0 25px ${tc}45` }}>
              <Phone size={20} /> Call Me
            </a>
          )}
          <LikeBtn />
        </div>
      </motion.div>

      {/* Services */}
      {(profile.services?.length ?? 0) > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
          <h2 className="text-3xl font-black tracking-tighter text-white">What I Offer</h2>
          <div className="space-y-4">
            {profile.services!.map(service => (
              <div key={service.id}
                className="flex flex-col sm:flex-row items-start gap-5 p-6 glass-card border border-white/10 rounded-2xl hover:border-white/20 transition-all group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-black text-white">{service.title}</h3>
                    {service.featured && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full"
                        style={{ background: `${tc}20`, color: tc }}>
                        <Star size={9} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed">{service.description}</p>
                </div>
                <div className="shrink-0 w-full sm:w-40 space-y-2 text-center">
                  {service.price && <div className="text-2xl font-black" style={{ color: tc }}>{service.price}</div>}
                  <ServiceCTA service={service} />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Links */}
      {(profile.links?.length ?? 0) > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
          <h2 className="text-2xl font-black tracking-tighter text-white">Find Me Online</h2>
          <LinksEl />
        </motion.section>
      )}

      {/* About Me */}
      {profile.aboutMe && (
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
          <h2 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
            <UserIcon size={22} style={{ color: tc }} /> About Me
          </h2>
          <div className="p-8 glass-card border border-white/10 rounded-3xl text-white/65 text-sm leading-relaxed">
            <Markdown>{profile.aboutMe}</Markdown>
          </div>
        </motion.section>
      )}

      <ContactFormEl />
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // ─── SALES MODE ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16"
      style={{ '--theme-color': tc } as React.CSSProperties}>

      {/* Compact Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col sm:flex-row items-center sm:items-start gap-7 p-8 glass-card border rounded-[40px] overflow-hidden"
        style={{ borderColor: `${tc}25`, background: `linear-gradient(135deg, ${tc}07, transparent)` }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ background: tc }} />
        <AvatarEl size="lg" />
        <div className="flex-1 text-center sm:text-left z-10">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-1">{profile.displayName}</h1>
          <p className="font-bold text-sm mb-4" style={{ color: tc }}>@{profile.username}</p>
          <p className="text-white/60 mb-5 leading-relaxed text-sm max-w-lg">{profile.bio}</p>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {profile.whatsapp && (
              <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 0 15px #25D36630' }}>
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-white/5 border border-white/10 text-white/65 hover:bg-white/10 transition-all">
                <Phone size={16} /> Call
              </a>
            )}
            <LikeBtn />
          </div>
        </div>
      </motion.div>

      {/* Services Grid (Offer Cards) */}
      {(profile.services?.length ?? 0) > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-white">Services & Offers</h2>
              <p className="text-white/35 text-sm mt-1">Choose a service to get started</p>
            </div>
            <span className="text-xs font-bold text-white/25 border border-white/10 px-3 py-1 rounded-full">
              {profile.services!.length} {profile.services!.length === 1 ? 'service' : 'services'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.services!.map(service => (
              <motion.div key={service.id} whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative flex flex-col p-6 glass-card border rounded-3xl overflow-hidden transition-all ${
                  service.featured ? '' : 'border-white/10'
                }`}
                style={service.featured ? {
                  borderColor: `${tc}40`,
                  boxShadow: `0 0 35px ${tc}15`
                } : {}}>

                {/* Featured glow */}
                {service.featured && (
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-30 pointer-events-none"
                    style={{ background: tc }} />
                )}

                {service.featured && (
                  <div className="absolute top-4 right-4">
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
                      style={{ background: `${tc}22`, color: tc }}>
                      <Star size={10} fill="currentColor" /> Featured
                    </span>
                  </div>
                )}

                <div className="flex-1 mb-5">
                  <h3 className="text-xl font-black text-white mb-2 pr-12">{service.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{service.description}</p>
                </div>

                <div className="space-y-3">
                  {service.price && (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black" style={{ color: tc }}>{service.price}</span>
                    </div>
                  )}
                  <ServiceCTA service={service} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* CTA Strip */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="relative p-12 rounded-[40px] text-center overflow-hidden border"
        style={{ borderColor: `${tc}20`, background: `linear-gradient(135deg, ${tc}10, transparent)` }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/3 to-transparent" />
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter text-white mb-3">Ready to Get Started?</h2>
          <p className="text-white/45 mb-8 text-lg">Let's work together and make something great.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {profile.whatsapp && (
              <a href={`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent("Hi! I'd like to start a project with you.")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 rounded-full font-black text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 0 25px #25D36640' }}>
                <Zap size={20} /> Start on WhatsApp
              </a>
            )}
            <button onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-black text-black transition-all hover:brightness-110 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${tc}, #3A86FF)`, boxShadow: `0 0 25px ${tc}40` }}>
              <Send size={20} /> Send Inquiry
            </button>
          </div>
        </div>
      </motion.div>

      {/* Links */}
      {(profile.links?.length ?? 0) > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
          <h2 className="text-2xl font-black tracking-tighter text-white">More Links</h2>
          <LinksEl />
        </motion.section>
      )}

      <ContactFormEl />
    </div>
  );
}
