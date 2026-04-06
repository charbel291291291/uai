import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Link, X, Check, Loader2, Pencil, Trash2, User } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import confetti from 'canvas-confetti';
import { supabase } from '../supabase';

interface AvatarUploadProps {
  uid: string;
  displayName: string;
  currentUrl?: string;
  currentSource?: 'upload' | 'url' | 'initials';
  onUpdate: (url: string, source: 'upload' | 'url' | 'initials') => void;
  themeColor?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  uid, 
  displayName, 
  currentUrl, 
  currentSource = 'initials', 
  onUpdate,
  themeColor = '#00C6FF'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>(currentSource === 'url' ? 'url' : 'upload');
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const [urlInput, setUrlInput] = useState(currentSource === 'url' ? currentUrl || '' : '');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup success timer on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Fallback Initials Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(displayName || 'User');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Accept only: jpg, png, webp');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Max size: 2MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Compression
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Upload to Supabase Storage
      const fileName = `${uid}/${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onUpdate(publicUrl, 'upload');
      triggerSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setIsLoadingUrl(true);
    setError(null);

    try {
      // Validate URL is an image
      const response = await fetch(urlInput, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      
      if (!contentType?.startsWith('image/')) {
        setError('Invalid image URL');
        setIsLoadingUrl(false);
        return;
      }

      setPreviewUrl(urlInput);
      onUpdate(urlInput, 'url');
      triggerSuccess();
    } catch (err) {
      console.error('URL validation error:', err);
      setError('Invalid image URL or broken link');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const triggerSuccess = useCallback(() => {
    setIsSuccess(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [themeColor, '#ffffff'],
    });
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setIsSuccess(false), 3000);
  }, [themeColor]);

  const removeAvatar = async () => {
    setPreviewUrl(undefined);
    setUrlInput('');
    onUpdate('', 'initials');
    // If it was an uploaded file, we might want to delete it from storage
    // but for simplicity we'll just clear the reference in the profile
  };

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 relative glow-box transition-all group-hover:border-white/20"
            style={{ boxShadow: `0 0 20px ${themeColor}33` }}
          >
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Avatar Preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={() => {
                  setError('Image failed to load');
                  setPreviewUrl(undefined);
                }}
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${themeColor}, #000)` }}
              >
                {initials}
              </div>
            )}

            {/* Loading Overlay */}
            {(isUploading || isLoadingUrl) && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {/* Success Overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-brand-cyan/80 flex items-center justify-center"
                  style={{ backgroundColor: `${themeColor}CC` }}
                >
                  <Check className="w-12 h-12 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => activeTab === 'upload' && fileInputRef.current?.click()}>
              <Pencil className="w-6 h-6 text-white" />
            </div>
          </motion.div>

          {previewUrl && (
            <button 
              onClick={removeAvatar}
              className="absolute -top-2 -right-2 p-2 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        <div className="text-center">
          <h4 className="text-lg font-bold text-white tracking-tight">{displayName}</h4>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Avatar Preview</p>
        </div>
      </div>

      {/* Input Tabs */}
      <div className="glass-card p-1 rounded-2xl flex border border-white/5">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'upload' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Upload size={16} />
          Upload Image
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'url' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Link size={16} />
          Use URL
        </button>
      </div>

      {/* Input Content */}
      <div className="space-y-4">
        {activeTab === 'upload' ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                const input = fileInputRef.current;
                if (input) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  input.files = dataTransfer.files;
                  handleFileChange({ target: input } as any);
                }
              }
            }}
            className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-white/40 group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-white">Click or drag to upload</p>
              <p className="text-xs text-white/40 mt-1">JPG, PNG, WEBP (Max 2MB)</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste image URL here..."
                className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-cyan transition-colors"
              />
              <button
                onClick={handleUrlSubmit}
                disabled={isLoadingUrl || !urlInput.trim()}
                className="px-6 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {isLoadingUrl ? <Loader2 className="animate-spin" /> : 'Apply'}
              </button>
            </div>
            <p className="text-xs text-white/40 px-2">
              Note: We'll validate the link before applying.
            </p>
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
          >
            <X size={18} />
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AvatarUpload;
