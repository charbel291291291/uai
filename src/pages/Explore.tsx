import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { Search, Sparkles, User as UserIcon } from 'lucide-react';

export default function Explore() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_private', false)
          .limit(50);

        if (error) throw error;

        const fetchedProfiles = (data || []).map(d => ({
          uid: d.id,
          username: d.username,
          displayName: d.display_name,
          bio: d.bio,
          avatarUrl: d.avatar_url,
          qaPairs: d.qa_pairs || [],
          tags: d.tags || []
        } as UserProfile));

        setProfiles(fetchedProfiles);
      } catch (err) {
        console.error('Fetch Profiles Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const allTags = Array.from(new Set(profiles.flatMap(p => p.tags || []))).sort();

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = !selectedTag || p.tags?.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-uai-gradient mb-2">Explore Twins</h1>
          <p className="text-white/40 text-lg">Discover and chat with AI versions of creators.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-cyan transition-colors" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, bio, or tag..."
            className="w-full md:w-80 pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-cyan transition-all glass-card"
          />
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              !selectedTag 
                ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_15px_rgba(0,198,255,0.3)]' 
                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                selectedTag === tag 
                  ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_15px_rgba(0,198,255,0.3)]' 
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-white/5 rounded-[40px] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.uid}
              className="group relative transition-transform duration-200 hover:-translate-y-1.5"
            >
              <Link to={`/p/${profile.username}`} className="block h-full p-8 glass-card border border-white/10 rounded-[40px] hover:border-brand-cyan/30 transition-all overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Sparkles className="text-brand-cyan" size={20} />
                </div>
                
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 group-hover:border-brand-cyan/50 transition-colors glow-box">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20">
                        <UserIcon size={40} />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white group-hover:text-brand-cyan transition-colors">{profile.displayName}</h3>
                    <p className="text-sm text-white/40 font-mono">@{profile.username}</p>
                  </div>
                  
                  <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
                    {profile.bio || "No bio provided yet."}
                  </p>

                  <div className="flex flex-wrap justify-center gap-1">
                    {profile.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-brand-cyan/60 border border-brand-cyan/10">
                        {tag}
                      </span>
                    ))}
                    {(profile.tags?.length || 0) > 3 && (
                      <span className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/20 border border-white/5">
                        +{(profile.tags?.length || 0) - 3}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 flex gap-2">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/40 border border-white/5">
                      {profile.qaPairs?.length || 0} Knowledge Entries
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredProfiles.length === 0 && (
        <div className="text-center py-24 glass-card rounded-[40px] border border-white/10">
          <p className="text-white/40 text-xl">No twins found matching your search.</p>
        </div>
      )}
    </div>
  );
}
