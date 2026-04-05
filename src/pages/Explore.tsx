import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  User as UserIcon,
  SlidersHorizontal,
  ArrowUpDown,
  TrendingUp,
  Clock,
  Users,
  X,
  ChevronDown,
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

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await profileService.getAllProfiles({
          isPrivate: false,
          limit: 100,
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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    profiles.forEach((profile) => profile.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    let result = [...profiles];

    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (profile) =>
          profile.displayName?.toLowerCase().includes(search) ||
          profile.username?.toLowerCase().includes(search) ||
          profile.bio?.toLowerCase().includes(search) ||
          profile.tags?.some((tag) => tag.toLowerCase().includes(search)),
      );
    }

    if (filters.tags.length > 0) {
      result = result.filter((profile) => filters.tags.some((tag) => profile.tags?.includes(tag)));
    }

    if (filters.hasAvatar !== null) {
      result = result.filter((profile) => (filters.hasAvatar ? !!profile.avatarUrl : !profile.avatarUrl));
    }

    if (filters.hasBio !== null) {
      result = result.filter((profile) => (filters.hasBio ? !!profile.bio?.trim() : !profile.bio?.trim()));
    }

    if (filters.minKnowledge > 0) {
      result = result.filter((profile) => (profile.qaPairs?.length || 0) >= filters.minKnowledge);
    }

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

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((currentTag) => currentTag !== tag) : [...prev.tags, tag],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      tags: [],
      hasAvatar: null,
      hasBio: null,
      minKnowledge: 0,
    });
  }, []);

  const activeFiltersCount =
    filters.tags.length +
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

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-14 sm:space-y-16">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">Explore</p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Find the right twin
              </h1>
              <p className="max-w-md text-sm leading-6 text-white/45 sm:text-base">
                Browse public digital twins, scan quickly, and jump straight into the profiles that matter.
              </p>
            </div>

            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by name, bio, or tags..."
                  className="w-full rounded-[28px] border border-white/5 bg-white/[0.02] py-4 pl-14 pr-12 text-base text-white placeholder:text-white/25 focus:outline-none focus:border-white/10"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/55"
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="space-y-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex justify-start">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowFilters((prev) => !prev)}
                  leftIcon={<SlidersHorizontal size={16} />}
                  className="relative border-white/5 bg-white/[0.02] shadow-none"
                >
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="relative min-w-[180px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-11 w-full appearance-none rounded-2xl border border-white/5 bg-white/[0.02] px-4 pr-10 text-sm text-white focus:outline-none focus:border-white/10"
                  >
                    <option value="recent" className="bg-[#0f172a]">
                      Most Recent
                    </option>
                    <option value="popular" className="bg-[#0f172a]">
                      Most Popular
                    </option>
                    <option value="name" className="bg-[#0f172a]">
                      Name (A-Z)
                    </option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                </div>

                <div className="hidden rounded-2xl border border-white/5 bg-white/[0.02] p-1 sm:flex">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-xl px-3 py-2 transition-colors ${
                      viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'
                    }`}
                    aria-label="Grid view"
                  >
                    <div className="grid h-4 w-4 grid-cols-2 gap-0.5">
                      <div className="rounded-sm bg-current" />
                      <div className="rounded-sm bg-current" />
                      <div className="rounded-sm bg-current" />
                      <div className="rounded-sm bg-current" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`rounded-xl px-3 py-2 transition-colors ${
                      viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'
                    }`}
                    aria-label="List view"
                  >
                    <div className="flex h-4 w-4 flex-col justify-center gap-0.5">
                      <div className="h-0.5 rounded-full bg-current" />
                      <div className="h-0.5 rounded-full bg-current" />
                      <div className="h-0.5 rounded-full bg-current" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6 rounded-[28px] border border-white/5 bg-white/[0.02] p-6">
                    {allTags.length > 0 && (
                      <div className="space-y-3">
                        <label className="block text-xs font-medium uppercase tracking-[0.18em] text-white/35">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {allTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                                filters.tags.includes(tag)
                                  ? 'border-white/10 bg-white text-black'
                                  : 'border-white/5 bg-white/[0.02] text-white/55 hover:text-white/75'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FilterToggleGroup
                        label="Profile Picture"
                        value={filters.hasAvatar}
                        onChange={(value) => setFilters((prev) => ({ ...prev, hasAvatar: value }))}
                      />

                      <FilterToggleGroup
                        label="Bio"
                        value={filters.hasBio}
                        onChange={(value) => setFilters((prev) => ({ ...prev, hasBio: value }))}
                      />

                      <div className="space-y-3">
                        <label className="block text-xs font-medium uppercase tracking-[0.18em] text-white/35">
                          Knowledge Entries
                        </label>
                        <select
                          value={filters.minKnowledge}
                          onChange={(e) => setFilters((prev) => ({ ...prev, minKnowledge: Number(e.target.value) }))}
                          className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white focus:outline-none focus:border-white/10"
                        >
                          <option value={0} className="bg-[#0f172a]">
                            Any amount
                          </option>
                          <option value={5} className="bg-[#0f172a]">
                            5+ entries
                          </option>
                          <option value={10} className="bg-[#0f172a]">
                            10+ entries
                          </option>
                          <option value={20} className="bg-[#0f172a]">
                            20+ entries
                          </option>
                        </select>
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="border-t border-white/5 pt-4">
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/65"
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
          </motion.section>

          <section className="space-y-8">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
              <p className="text-sm text-white/40">
                {loading ? (
                  'Loading...'
                ) : (
                  <>
                    <span className="font-semibold text-white">{filteredProfiles.length}</span> twins found
                  </>
                )}
              </p>

              <div className="flex items-center gap-2 text-sm text-white/30">
                <ArrowUpDown size={14} />
                <span>{sortBy === 'popular' ? 'Popular' : sortBy === 'name' ? 'Name' : 'Recent'}</span>
              </div>
            </div>

            {loading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className={`animate-pulse rounded-[28px] border border-white/5 bg-white/[0.02] ${
                      viewMode === 'grid' ? 'h-72' : 'h-28'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
                <AnimatePresence mode="popLayout">
                  {filteredProfiles.map((profile, index) => (
                    <motion.div
                      key={profile.uid}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                    >
                      {viewMode === 'grid' ? <ProfileCard profile={profile} /> : <ProfileListItem profile={profile} />}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {!loading && filteredProfiles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[32px] border border-white/5 bg-white/[0.02] px-6 py-16 text-center"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.02]">
                  <Search className="text-white/20" size={24} />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">No twins found</h3>
                <p className="mb-6 text-sm text-white/40">Try adjusting your search or filters.</p>
                {activeFiltersCount > 0 && (
                  <Button variant="secondary" onClick={clearFilters} className="border-white/5 bg-white/[0.02] shadow-none">
                    Clear all filters
                  </Button>
                )}
              </motion.div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function FilterToggleGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium uppercase tracking-[0.18em] text-white/35">{label}</label>
      <div className="flex gap-2">
        {[
          { value: null, label: 'Any' },
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ].map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value as boolean | null)}
            className={`flex-1 rounded-2xl border px-3 py-3 text-sm transition-colors ${
              value === option.value
                ? 'border-white/10 bg-white/10 text-white'
                : 'border-white/5 bg-white/[0.02] text-white/45 hover:text-white/70'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <Link
      to={`/p/${profile.username}`}
      className="group flex h-full flex-col rounded-[28px] border border-white/5 bg-white/[0.02] p-5 transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="mb-5 flex items-start gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/[0.03]">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserIcon className="text-white/20" size={26} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-base font-semibold text-white">{profile.displayName}</h3>
          <p className="truncate text-sm text-white/30">@{profile.username}</p>
        </div>
      </div>

      <div className="min-h-[52px] flex-1">
        {profile.bio ? (
          <p className="line-clamp-3 text-sm leading-6 text-white/45">{profile.bio}</p>
        ) : (
          <p className="text-sm text-white/25">No bio added yet.</p>
        )}
      </div>

      {profile.tags && profile.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/38">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-4 border-t border-white/5 pt-4 text-white/20">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} />
          <span className="text-xs">{profile.analytics?.views || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span className="text-xs">{profile.qaPairs?.length || 0}</span>
        </div>
      </div>
    </Link>
  );
}

function ProfileListItem({ profile }: { profile: UserProfile }) {
  return (
    <Link
      to={`/p/${profile.username}`}
      className="group flex items-center gap-4 rounded-[24px] border border-white/5 bg-white/[0.02] p-4 transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-white/[0.03]">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserIcon className="text-white/20" size={22} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-3">
          <h3 className="truncate text-base font-semibold text-white">{profile.displayName}</h3>
          <span className="truncate text-sm text-white/25">@{profile.username}</span>
        </div>
        {profile.bio && <p className="truncate text-sm text-white/42">{profile.bio}</p>}
      </div>

      <div className="hidden items-center gap-6 text-white/20 sm:flex">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} />
          <span className="text-sm">{profile.analytics?.views || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={14} />
          <span className="text-sm">{profile.qaPairs?.length || 0}</span>
        </div>
      </div>
    </Link>
  );
}
