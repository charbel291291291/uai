import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  User as UserIcon, 
  SlidersHorizontal, 
  ArrowUpDown,
  TrendingUp,
  Clock,
  Users,
  X,
  ChevronDown
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/Button';
import { profileService } from '../services';
import type { UserProfile } from '../types';

type SortOption = 'recent' | 'popular' | 'name';
type ViewMode = 'grid' | 'list';

interface FilterState {
  search: string;
  tags: string[];
  hasAvatar: boolean | null;
  hasBio: boolean | null;
  minKnowledge: number;
}

export default function Explore() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tags: [],
    hasAvatar: null,
    hasBio: null,
    minKnowledge: 0,
  });

  // Fetch profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await profileService.getAllProfiles({ 
          isPrivate: false,
          limit: 100 
        });

        if (error) throw new Error(error.message);
        setProfiles(data || []);
      } catch (err) {
        console.error('Fetch Profiles Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    profiles.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [profiles]);

  // Filter and sort profiles
  const filteredProfiles = useMemo(() => {
    let result = [...profiles];

    // Search filter
    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      result = result.filter(p => 
        p.displayName?.toLowerCase().includes(search) ||
        p.username?.toLowerCase().includes(search) ||
        p.bio?.toLowerCase().includes(search) ||
        p.tags?.some(t => t.toLowerCase().includes(search))
      );
    }

    // Tag filters
    if (filters.tags.length > 0) {
      result = result.filter(p => 
        filters.tags.some(tag => p.tags?.includes(tag))
      );
    }

    // Has avatar filter
    if (filters.hasAvatar !== null) {
      result = result.filter(p => filters.hasAvatar ? !!p.avatarUrl : !p.avatarUrl);
    }

    // Has bio filter
    if (filters.hasBio !== null) {
      result = result.filter(p => filters.hasBio ? !!p.bio?.trim() : !p.bio?.trim());
    }

    // Min knowledge entries
    if (filters.minKnowledge > 0) {
      result = result.filter(p => (p.qaPairs?.length || 0) >= filters.minKnowledge);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.analytics?.views || 0) - (a.analytics?.views || 0);
        case 'name':
          return (a.displayName || a.username).localeCompare(b.displayName || b.username);
        case 'recent':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return result;
  }, [profiles, filters, sortBy]);

  // Toggle tag selection
  const toggleTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      tags: [],
      hasAvatar: null,
      hasBio: null,
      minKnowledge: 0,
    });
  }, []);

  const activeFiltersCount = filters.tags.length + 
    (filters.hasAvatar !== null ? 1 : 0) + 
    (filters.hasBio !== null ? 1 : 0) +
    (filters.minKnowledge > 0 ? 1 : 0);

  return (
    <>
      <SEO
        title="Explore"
        description="Discover and chat with AI versions of creators. Explore digital twins on UAi."
        type="website"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-10 sm:mb-14 space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-uai-gradient"
          >
            Explore Twins
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/45 text-base sm:text-lg max-w-md leading-relaxed"
          >
            Discover AI-powered digital twins and connect with creators.
          </motion.p>
        </div>

        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5"
        >
          <div className="max-w-2xl mx-auto w-full">
            <div className="relative group">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-cyan transition-colors" 
                size={20} 
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by name, bio, or tags..."
                className="w-full pl-12 pr-12 py-4 bg-white/[0.02] border border-white/5 rounded-2xl 
                           text-white placeholder:text-white/30 
                           focus:outline-none focus:border-brand-cyan/40 focus:bg-white/[0.03]
                           transition-all"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 sm:mb-10"
        >
          <div className="flex justify-start">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<SlidersHorizontal size={18} />}
              className="relative border-white/5 bg-white/[0.02]"
            >
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-cyan text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-start sm:justify-end gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none w-full h-full px-4 pr-10 bg-white/[0.02] border border-white/5 rounded-2xl
                           text-white text-sm font-medium
                           focus:outline-none focus:border-brand-cyan/40 focus:bg-white/[0.03]
                           transition-all cursor-pointer"
              >
                <option value="recent" className="bg-[#0f172a]">Most Recent</option>
                <option value="popular" className="bg-[#0f172a]">Most Popular</option>
                <option value="name" className="bg-[#0f172a]">Name (A-Z)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
            </div>

            <div className="hidden sm:flex bg-white/[0.02] border border-white/5 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-brand-cyan/20 text-brand-cyan' 
                    : 'text-white/40 hover:text-white/60'
                }`}
                aria-label="Grid view"
              >
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-current rounded-sm" />
                  <div className="bg-current rounded-sm" />
                  <div className="bg-current rounded-sm" />
                  <div className="bg-current rounded-sm" />
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === 'list' 
                    ? 'bg-brand-cyan/20 text-brand-cyan' 
                    : 'text-white/40 hover:text-white/60'
                }`}
                aria-label="List view"
              >
                  <div className="flex flex-col gap-0.5 w-4 h-4 justify-center">
                    <div className="h-0.5 bg-current rounded-full" />
                    <div className="h-0.5 bg-current rounded-full" />
                    <div className="h-0.5 bg-current rounded-full" />
                  </div>
                </button>
          </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="p-6 sm:p-7 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
                {/* Tags Filter */}
                {allTags.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 block">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                            filters.tags.includes(tag)
                              ? 'bg-brand-cyan text-black border-brand-cyan'
                              : 'bg-white/5 text-white/60 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  {/* Has Avatar */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 block">
                      Profile Picture
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: null, label: 'Any' },
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' },
                      ].map(({ value, label }) => (
                        <button
                          key={String(value)}
                          onClick={() => setFilters(prev => ({ ...prev, hasAvatar: value as boolean | null }))}
                          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                            filters.hasAvatar === value
                              ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30'
                              : 'bg-white/5 text-white/60 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Has Bio */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 block">
                      Bio
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: null, label: 'Any' },
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' },
                      ].map(({ value, label }) => (
                        <button
                          key={String(value)}
                          onClick={() => setFilters(prev => ({ ...prev, hasBio: value as boolean | null }))}
                          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                            filters.hasBio === value
                              ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30'
                              : 'bg-white/5 text-white/60 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Knowledge Entries */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 block">
                      Knowledge Entries
                    </label>
                    <select
                      value={filters.minKnowledge}
                      onChange={(e) => setFilters(prev => ({ ...prev, minKnowledge: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-sm
                                 focus:outline-none focus:border-brand-cyan/40 transition-all"
                    >
                      <option value={0} className="bg-[#0f172a]">Any amount</option>
                      <option value={5} className="bg-[#0f172a]">5+ entries</option>
                      <option value={10} className="bg-[#0f172a]">10+ entries</option>
                      <option value={20} className="bg-[#0f172a]">20+ entries</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-white/40 hover:text-white/60 transition-colors flex items-center gap-2"
                    >
                      <X size={14} />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-white/40 text-sm">
            {loading ? (
              'Loading...'
            ) : (
              <>
                <span className="text-white font-semibold">{filteredProfiles.length}</span>
                {' '}twins found
              </>
            )}
          </p>
          
          {/* Sort indicator */}
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <ArrowUpDown size={14} />
            <span className="capitalize">{sortBy.replace('-', ' ')}</span>
          </div>
        </div>

        {/* Profiles Grid/List */}
        {loading ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-5"
          }>
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className={`bg-white/[0.02] border border-white/5 animate-pulse ${
                  viewMode === 'grid' ? 'h-72 rounded-3xl' : 'h-24 rounded-2xl'
                }`} 
              />
            ))}
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-5"
          }>
            <AnimatePresence mode="popLayout">
              {filteredProfiles.map((profile, index) => (
                <motion.div
                  key={profile.uid}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {viewMode === 'grid' ? (
                    <ProfileCard profile={profile} />
                  ) : (
                    <ProfileListItem profile={profile} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProfiles.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <Search className="text-white/20" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No twins found</h3>
            <p className="text-white/40 mb-6">Try adjusting your search or filters</p>
            {activeFiltersCount > 0 && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}

// Profile Card Component (Grid View)
function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <Link
      to={`/p/${profile.username}`}
      className="group block h-full p-6 bg-white/[0.02] border border-white/5 rounded-3xl 
                 hover:-translate-y-1 hover:border-brand-cyan/40 hover:bg-white/[0.03]
                 transition-all duration-300"
    >
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/5 group-hover:border-brand-cyan/30 transition-colors">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <UserIcon className="text-white/20" size={32} />
            </div>
          )}
        </div>
        
        {/* AI Indicator */}
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-cyan rounded-xl flex items-center justify-center shadow-lg shadow-brand-cyan/20">
          <Sparkles className="text-black" size={14} />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className="font-bold text-white group-hover:text-brand-cyan transition-colors truncate">
          {profile.displayName}
        </h3>
        <p className="text-sm text-white/40 font-mono">@{profile.username}</p>
        
        {profile.bio && (
          <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Tags */}
      {profile.tags && profile.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {profile.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] font-medium text-white/50 uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
          {profile.tags.length > 3 && (
            <span className="px-2 py-0.5 text-[10px] text-white/30">
              +{profile.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-white/20">
          <TrendingUp size={12} />
          <span className="text-xs">{profile.analytics?.views || 0}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/20">
          <Clock size={12} />
          <span className="text-xs">{profile.qaPairs?.length || 0}</span>
        </div>
      </div>
    </Link>
  );
}

// Profile List Item Component (List View)
function ProfileListItem({ profile }: { profile: UserProfile }) {
  return (
    <Link
      to={`/p/${profile.username}`}
      className="group flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl 
                 hover:-translate-y-1 hover:border-brand-cyan/40 hover:bg-white/[0.03]
                 transition-all duration-300"
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/5 group-hover:border-brand-cyan/30 transition-colors flex-shrink-0">
        {profile.avatarUrl ? (
          <img 
            src={profile.avatarUrl} 
            alt={profile.displayName} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <UserIcon className="text-white/20" size={24} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-bold text-white group-hover:text-brand-cyan transition-colors truncate">
            {profile.displayName}
          </h3>
          <span className="text-sm text-white/20 font-mono">@{profile.username}</span>
        </div>
        
        {profile.bio && (
          <p className="text-sm text-white/50 truncate">
            {profile.bio}
          </p>
        )}

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.tags.slice(0, 4).map(tag => (
              <span 
                key={tag}
                className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] font-medium text-white/40"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-white/20">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} />
          <span className="text-sm">{profile.analytics?.views || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={14} />
          <span className="text-sm">{profile.qaPairs?.length || 0}</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="text-white/20 group-hover:text-brand-cyan transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}
