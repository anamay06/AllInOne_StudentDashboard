import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Save, Image as ImageIcon, Loader2, Code2, ShieldAlert,
  Hash, Code, Shield, UploadCloud, Github, Linkedin, Twitter, Instagram, Facebook, Globe, Settings, X, ExternalLink, Calendar, Check
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api';

export default function AboutMe() {
  const { user } = useAuth();
  
  // States for user profile
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
    lc_username: '',
    cf_username: '',
    cc_username: '',
    github_username: '',
    linkedin_username: '',
    twitter_username: '',
    instagram_username: '',
    facebook_username: '',
    google_calendar_email: '',
  });
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingObj, setIsUploadingObj] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPresenceModalOpen, setIsPresenceModalOpen] = useState(false);
  const [isPlatformsModalOpen, setIsPlatformsModalOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        // Fetch user basic info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, bio, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (userError) throw userError;

        // Fetch user settings (coding handles)
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('lc_username, cf_username, cc_username, github_username, linkedin_username, twitter_username, instagram_username, facebook_username, google_calendar_email')
          .eq('user_id', user.id)
          .single();
          
        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

        setProfile({
          full_name: userData?.full_name || '',
          bio: userData?.bio || '',
          avatar_url: userData?.avatar_url || '',
          lc_username: settingsData?.lc_username || '',
          cf_username: settingsData?.cf_username || '',
          cc_username: settingsData?.cc_username || '',
          github_username: settingsData?.github_username || '',
          linkedin_username: settingsData?.linkedin_username || '',
          twitter_username: settingsData?.twitter_username || '',
          instagram_username: settingsData?.instagram_username || '',
          facebook_username: settingsData?.facebook_username || '',
          google_calendar_email: settingsData?.google_calendar_email || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',
    onSuccess: async (codeResponse) => {
      setIsGoogleSyncing(true);
      try {
        const res = await fetch(`${API_URL}/api/google/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeResponse.code, userId: user.id })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.success) {
          setProfile(prev => ({ ...prev, google_calendar_email: data.email }));
          setMessage({ type: 'success', text: 'Google Calendar permanently synced via securely vaulted tokens!' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to sync Google Calendar: ' + err.message });
      } finally {
        setIsGoogleSyncing(false);
      }
    },
    onError: (err) => {
      setMessage({ type: 'error', text: 'Google Login flow failed.' });
    }
  });

  const handleDisconnectGoogle = async () => {
    setIsGoogleSyncing(true);
    try {
      const res = await fetch(`${API_URL}/api/google/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProfile(prev => ({ ...prev, google_calendar_email: '' }));
      setMessage({ type: 'success', text: 'Google Calendar securely disconnected.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to disconnect: ' + err.message });
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // 1. Update Users Table
      const { error: userError } = await supabase
        .from('users')
        .update({ full_name: profile.full_name, bio: profile.bio || null })
        .eq('id', user.id);

      if (userError) throw userError;

      // 2. Update Settings Table
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
          lc_username: profile.lc_username || null,
          cf_username: profile.cf_username || null,
          cc_username: profile.cc_username || null,
          github_username: profile.github_username || null,
          linkedin_username: profile.linkedin_username || null,
          twitter_username: profile.twitter_username || null,
          instagram_username: profile.instagram_username || null,
          facebook_username: profile.facebook_username || null,
        })
        .eq('user_id', user.id);

      if (settingsError) throw settingsError;

      setMessage({ type: 'success', text: 'Profile successfully secured!' });
      
      // Auto-hide message
      setTimeout(() => setMessage(null), 5000);
      
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to securely update profile internals.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // The bucket is strictly heavily enforced to 2MB. We add a UI check for immediate feedback!
    if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File strictly exceeds the 2MB server limit.' });
        return;
    }

    try {
      setIsUploadingObj(true);
      setMessage(null);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload explicitly to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Retrieve public URL mathematically
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Log it natively to the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setMessage({ type: 'success', text: 'Quantum avatar upload successfully synchronized.' });
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Avatar upload failed:', error);
      setMessage({ type: 'error', text: 'Avatar proxy upload rejected by server.' });
    } finally {
      setIsUploadingObj(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-[2%] lg:p-[3%] overflow-y-auto w-full">
      
      {/* PAGE CONTENT — Symmetrical Vertical Flow */}
      <div className="space-y-6 pb-10">

        {/* ═══ ROW 1: PROFILE HEADER — Avatar + Identity Side by Side ═══ */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="bg-card rounded-[1.5rem] border-[4px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary/20 overflow-hidden relative">
            <div className="bg-gradient-to-r from-secondary/10 via-card to-violet-50/30 h-20 w-full absolute top-0 left-0 border-b-[3px] border-primary/10"></div>
            
            <div className="p-6 xl:p-8 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 xl:gap-8">
              
              {/* Avatar Block */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-[clamp(7rem,12vw,9rem)] aspect-square rounded-full border-[4px] border-primary bg-background shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-secondary flex items-center justify-center overflow-hidden relative group">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={56} className="text-primary/20" strokeWidth={2} />
                  )}
                  <div 
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                    style={{ backgroundColor: '#000000a0' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingObj ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <>
                        <UploadCloud className="w-7 h-7 text-white mb-1" strokeWidth={2.5} />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change Avatar</span>
                      </>
                    )}
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" />
                <div className="mt-3 bg-secondary/10 border-[2px] border-secondary/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <ShieldAlert className="text-secondary shrink-0" size={12} />
                  <span className="text-[9px] font-bold text-primary/60">Max 2MB</span>
                </div>
              </div>

              {/* Identity Fields */}
              <div className="flex-1 w-full space-y-4 pt-2">
                <div className="mb-3">
                  <h3 className="text-2xl font-black text-primary truncate">
                    {profile.full_name || (user?.email ? user.email.split('@')[0] : 'Anonymous Agent')}
                  </h3>
                  <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mt-2 truncate border-[2px] border-primary/15 rounded-full py-1.5 px-4 bg-primary/5 inline-flex items-center gap-2 max-w-full w-fit">
                    <Mail size={13} className="shrink-0 opacity-70" /> <span className="truncate">{user?.email}</span>
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-black text-primary/70 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                     <Hash size={12} strokeWidth={3} className="text-secondary" /> Full Name
                  </label>
                  <input 
                    name="full_name" value={profile.full_name} onChange={handleInputChange}
                    placeholder="e.g. Alan Turing"
                    className="w-full h-11 border-[3px] border-primary rounded-xl px-4 text-sm font-bold bg-background shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/20 focus-visible:ring-0 focus-visible:border-secondary transition-colors placeholder:text-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-primary/70 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                     <Mail size={12} strokeWidth={3} className="text-secondary" /> Email (Read-Only)
                  </label>
                  <div className="w-full h-11 border-[3px] border-primary/20 bg-primary/5 rounded-xl px-4 flex items-center text-primary/50 font-bold text-sm cursor-not-allowed">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-primary/70 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                     <User size={12} strokeWidth={3} className="text-secondary" /> About Me
                  </label>
                  <textarea 
                    name="bio" value={profile.bio} onChange={handleInputChange}
                    placeholder="Tell us about yourself — your interests, goals, and what drives you..."
                    rows={3}
                    className="w-full border-[3px] border-primary rounded-xl px-4 py-3 text-sm font-bold bg-background shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/20 focus-visible:ring-0 focus-visible:border-secondary transition-colors placeholder:text-primary/30 resize-none"
                  />
                  <p className="text-[9px] font-bold text-primary/40 mt-1 ml-1">{(profile.bio || '').length}/300 characters</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ═══ ROW 2: Two Equal Columns — Global Presence + External Platforms ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Global Presence */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Card className="bg-card p-6 rounded-[1.5rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/20 relative bg-gradient-to-br from-card via-card to-secondary/10 h-full">
               <button onClick={() => setIsPresenceModalOpen(true)}
                  className="absolute top-5 right-5 w-8 h-8 bg-secondary border-[2px] border-primary rounded-full flex items-center justify-center text-white hover:bg-secondary/90 hover:scale-110 transition-all shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/40">
                  <Settings size={14} strokeWidth={3} />
               </button>
               <h2 className="text-lg font-black text-primary uppercase italic mb-4 flex items-center gap-2 border-b-[3px] border-primary/10 pb-2">
                 <Globe size={18} strokeWidth={3} className="text-secondary" /> Global Presence
               </h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'github_username', label: 'GitHub', icon: Github, color: 'text-slate-700', bgHover: 'hover:bg-slate-50', urlPrefix: 'https://github.com/' },
                    { name: 'linkedin_username', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bgHover: 'hover:bg-blue-50', urlPrefix: 'https://linkedin.com/in/' },
                    { name: 'twitter_username', label: 'X (Twitter)', icon: Twitter, color: 'text-sky-500', bgHover: 'hover:bg-sky-50', urlPrefix: 'https://twitter.com/' },
                    { name: 'instagram_username', label: 'Instagram', icon: Instagram, color: 'text-pink-600', bgHover: 'hover:bg-pink-50', urlPrefix: 'https://instagram.com/' },
                    { name: 'facebook_username', label: 'Facebook', icon: Facebook, color: 'text-blue-700', bgHover: 'hover:bg-blue-50', urlPrefix: 'https://facebook.com/' },
                  ].map((social, idx) => {
                    const hasLink = !!profile[social.name];
                    return (
                      <motion.div key={social.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + idx * 0.05 }}
                        className={`relative p-3 rounded-[1rem] border-[3px] flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[96px] ${
                          hasLink ? `border-primary bg-background ${social.bgHover} shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:shadow-none hover:translate-y-1 hover:-translate-x-1 cursor-pointer group` 
                          : 'border-dashed border-primary/20 bg-primary/5 opacity-70 cursor-pointer hover:bg-primary/10 hover:opacity-100 hover:border-primary/40'
                        }`}
                        onClick={() => hasLink ? window.open(`${social.urlPrefix}${profile[social.name]}`, '_blank') : setIsPresenceModalOpen(true)}>
                        <social.icon size={hasLink ? 26 : 22} strokeWidth={hasLink ? 2.5 : 2} className={`${social.color} mb-2 drop-shadow-sm transition-transform group-hover:scale-110`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${social.color}`}>{social.label}</span>
                        {hasLink && <span className="text-[10px] font-bold text-primary truncate w-full max-w-[90%] mt-1.5 px-1">{profile[social.name]}</span>}
                        
                        {hasLink ? (
                          <ExternalLink size={12} strokeWidth={3} className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${social.color}`} />
                        ) : (
                          <span className="absolute top-2 right-2 text-[7px] font-black text-secondary uppercase tracking-widest px-1.5 py-0.5 border-[2px] border-secondary/20 bg-secondary/10 rounded-full">Add</span>
                        )}
                      </motion.div>
                    )
                  })}
               </div>
            </Card>
          </motion.div>

          {/* External Platforms */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <Card className="bg-card p-6 rounded-[1.5rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/20 relative bg-gradient-to-br from-card via-card to-violet-50/30 h-full">
               <button onClick={() => setIsPlatformsModalOpen(true)}
                  className="absolute top-5 right-5 w-8 h-8 bg-secondary border-[2px] border-primary rounded-full flex items-center justify-center text-white hover:bg-secondary/90 hover:scale-110 transition-all shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/40">
                  <Settings size={14} strokeWidth={3} />
               </button>
               <h2 className="text-lg font-black text-primary uppercase italic mb-2 flex items-center gap-2 border-b-[3px] border-primary/10 pb-2">
                 <Code2 size={18} strokeWidth={3} className="text-secondary" /> External Platforms
               </h2>
               <p className="text-[10px] font-bold tracking-wide text-primary/50 mb-4">
                 Link your programming profiles for easy access.
               </p>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'lc_username', label: 'LeetCode', icon: Code2, color: 'text-violet-600', bgHover: 'hover:bg-violet-50', urlPrefix: 'https://leetcode.com/u/' },
                    { name: 'cf_username', label: 'CodeForces', icon: Code, color: 'text-fuchsia-600', bgHover: 'hover:bg-fuchsia-50', urlPrefix: 'https://codeforces.com/profile/' },
                    { name: 'cc_username', label: 'CodeChef', icon: Hash, color: 'text-sky-600', bgHover: 'hover:bg-sky-50', urlPrefix: 'https://www.codechef.com/users/' },
                  ].map((platform, idx) => {
                    const hasLink = !!profile[platform.name];
                    return (
                      <motion.div key={platform.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + idx * 0.05 }}
                        className={`relative p-3 rounded-[1rem] border-[3px] flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[96px] ${
                          hasLink ? `border-primary bg-background ${platform.bgHover} shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:shadow-none hover:translate-y-1 hover:-translate-x-1 cursor-pointer group` 
                          : 'border-dashed border-primary/20 bg-primary/5 opacity-70 cursor-pointer hover:bg-primary/10 hover:opacity-100 hover:border-primary/40'
                        }`}
                        onClick={() => hasLink ? window.open(`${platform.urlPrefix}${profile[platform.name]}`, '_blank') : setIsPlatformsModalOpen(true)}>
                        <platform.icon size={hasLink ? 26 : 22} strokeWidth={hasLink ? 2.5 : 2} className={`${platform.color} mb-2 drop-shadow-sm transition-transform group-hover:scale-110`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${platform.color}`}>{platform.label}</span>
                        {hasLink && <span className="text-[10px] font-bold text-primary truncate w-full max-w-[90%] mt-1.5 px-1">{profile[platform.name]}</span>}
                        
                        {hasLink ? (
                          <ExternalLink size={12} strokeWidth={3} className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${platform.color}`} />
                        ) : (
                          <span className="absolute top-2 right-2 text-[7px] font-black text-secondary uppercase tracking-widest px-1.5 py-0.5 border-[2px] border-secondary/20 bg-secondary/10 rounded-full">Add</span>
                        )}
                      </motion.div>
                    )
                  })}
               </div>
            </Card>
          </motion.div>
        </div>

        {/* ═══ ROW 3: Integrations ═══ */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <Card className="bg-card p-6 rounded-[1.5rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/20 relative bg-gradient-to-br from-card via-card to-blue-50/30 w-full mb-8">
             <h2 className="text-lg font-black text-primary uppercase italic mb-2 flex items-center gap-2 border-b-[3px] border-primary/10 pb-2">
               <Globe size={18} strokeWidth={3} className="text-secondary" /> Integrations
             </h2>
             <p className="text-[10px] font-bold tracking-wide text-primary/50 mb-4">
               Connect external services to autonomously power your dashboard.
             </p>
             
             <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-[3px] border-primary/10 rounded-2xl bg-background shadow-inner gap-4">
               <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                 <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-[2px] border-blue-200 shrink-0">
                   <Calendar size={24} strokeWidth={2.5} className="text-blue-600" />
                 </div>
                 <div className="min-w-0">
                   <h3 className="text-sm font-black text-primary uppercase tracking-wide truncate">Google Calendar</h3>
                   {profile.google_calendar_email ? (
                     <p className="text-[10px] font-bold text-green-600 flex items-center gap-1 truncate w-[200px] sm:w-auto">
                       <Check size={12} strokeWidth={3} className="shrink-0" /> {profile.google_calendar_email}
                     </p>
                   ) : (
                     <p className="text-[10px] font-bold text-primary/40 truncate">Continuously sync events and tasks.</p>
                   )}
                 </div>
               </div>
               
               <div className="w-full sm:w-auto flex justify-end shrink-0">
                 {profile.google_calendar_email ? (
                   <Button onClick={handleDisconnectGoogle} disabled={isGoogleSyncing} className="bg-red-50 hover:bg-red-100 text-red-600 border-[2px] border-red-200 shadow-none font-bold text-xs uppercase tracking-widest rounded-xl transition-all w-full sm:w-auto">
                     {isGoogleSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                   </Button>
                 ) : (
                   <Button onClick={() => handleGoogleLogin()} disabled={isGoogleSyncing} className="bg-blue-600 hover:bg-blue-700 text-white shadow-[3px_3px_0px_#1e3a8a] border-none font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none w-full sm:w-auto">
                     {isGoogleSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Server'}
                   </Button>
                 )}
               </div>
             </div>
          </Card>
        </motion.div>

        {/* ═══ ROW 4: Status + Save ═══ */}
        {message && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border-[3px] font-bold text-sm flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50/50 border-green-500 text-green-700' : 'bg-red-50/50 border-red-500 text-red-700'
            }`}>
            {message.type === 'success' ? <Shield size={18} /> : <ShieldAlert size={18} />}
            {message.text}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="flex justify-center">
          <Button onClick={handleSaveProfile} disabled={isSaving}
            className="h-14 px-10 bg-primary hover:bg-secondary text-primary-foreground border-none rounded-2xl font-black text-sm uppercase tracking-widest shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-secondary/30 hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all flex items-center gap-2">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? 'Finalizing...' : 'Save Configuration'}
          </Button>
        </motion.div>

      </div>

      <AnimatePresence>
        {isPresenceModalOpen && (
          <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card rounded-[1.5rem] border-[4px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary overflow-hidden relative"
            >
              <div className="bg-primary/5 px-6 py-4 border-b-[3px] border-primary flex justify-between items-center">
                 <h3 className="text-xl font-black text-primary uppercase italic flex items-center gap-2">
                   <Globe size={20} strokeWidth={3} className="text-secondary" /> Edit Presence
                 </h3>
                 <button 
                   onClick={() => setIsPresenceModalOpen(false)}
                   className="w-8 h-8 rounded-full border-[2px] border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                 >
                   <X size={16} strokeWidth={3} />
                 </button>
              </div>
              
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                 {[
                    { name: 'github_username', label: 'GitHub', icon: Github, color: 'text-slate-700', ring: 'focus-visible:border-slate-700' },
                    { name: 'linkedin_username', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', ring: 'focus-visible:border-blue-600' },
                    { name: 'twitter_username', label: 'X (Twitter)', icon: Twitter, color: 'text-sky-500', ring: 'focus-visible:border-sky-500' },
                    { name: 'instagram_username', label: 'Instagram', icon: Instagram, color: 'text-pink-600', ring: 'focus-visible:border-pink-600' },
                    { name: 'facebook_username', label: 'Facebook', icon: Facebook, color: 'text-blue-700', ring: 'focus-visible:border-blue-700' },
                  ].map((social) => (
                    <div key={social.name} className="relative group">
                      <label className={`text-[10px] font-black uppercase tracking-widest mb-1 ml-1 ${social.color} flex items-center gap-1.5`}>
                        <social.icon size={12} strokeWidth={3} /> {social.label} Username
                      </label>
                      <div className="relative">
                        <input 
                          name={social.name}
                          value={profile[social.name]}
                          onChange={handleInputChange}
                          placeholder="username"
                          className={`w-full h-10 border-[3px] border-primary rounded-xl pl-9 pr-3 text-sm font-bold bg-background shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/10 focus-visible:ring-0 ${social.ring} transition-colors placeholder:text-primary/30 group-hover:shadow-[3px_3px_0px_var(--tw-shadow-color)] group-hover:shadow-primary/20`}
                        />
                        <social.icon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${social.color} opacity-70`} strokeWidth={2.5} />
                      </div>
                    </div>
                  ))}
              </div>
              
              <div className="p-4 border-t-[3px] border-primary bg-background/50 flex justify-end gap-3">
                <Button 
                  onClick={() => setIsPresenceModalOpen(false)}
                  className="font-black uppercase tracking-widest border-[2px] border-primary shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPlatformsModalOpen && (
          <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card rounded-[1.5rem] border-[4px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary overflow-hidden relative"
            >
              <div className="bg-primary/5 px-6 py-4 border-b-[3px] border-primary flex justify-between items-center">
                 <h3 className="text-xl font-black text-primary uppercase italic flex items-center gap-2">
                   <Code2 size={20} strokeWidth={3} className="text-secondary" /> Edit Platforms
                 </h3>
                 <button 
                   onClick={() => setIsPlatformsModalOpen(false)}
                   className="w-8 h-8 rounded-full border-[2px] border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                 >
                   <X size={16} strokeWidth={3} />
                 </button>
              </div>
              
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-[11px] font-bold text-primary/50 bg-primary/5 p-3 rounded-xl border border-primary/10">
                  Enter your exact public handle (not the full URL) to link your coding profiles.
                </p>
                 {[
                    { name: 'lc_username', label: 'LeetCode', icon: Code2, color: 'text-violet-600', ring: 'focus-visible:border-violet-500', placeholder: 'e.g. neetcode123' },
                    { name: 'cf_username', label: 'CodeForces', icon: Code, color: 'text-fuchsia-600', ring: 'focus-visible:border-fuchsia-500', placeholder: 'e.g. tourist' },
                    { name: 'cc_username', label: 'CodeChef', icon: Hash, color: 'text-sky-600', ring: 'focus-visible:border-sky-500', placeholder: 'e.g. aneesh_14' },
                  ].map((platform) => (
                    <div key={platform.name} className="relative group">
                      <label className={`text-[10px] font-black uppercase tracking-widest mb-1 ml-1 ${platform.color} flex items-center gap-1.5`}>
                        <platform.icon size={12} strokeWidth={3} /> {platform.label} Handle
                      </label>
                      <div className="relative">
                        <input 
                          name={platform.name}
                          value={profile[platform.name]}
                          onChange={handleInputChange}
                          placeholder={platform.placeholder}
                          className={`w-full h-10 border-[3px] border-primary rounded-xl pl-9 pr-3 text-sm font-bold bg-background shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/10 focus-visible:ring-0 ${platform.ring} transition-colors placeholder:text-primary/30 group-hover:shadow-[3px_3px_0px_var(--tw-shadow-color)] group-hover:shadow-primary/20`}
                        />
                        <platform.icon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${platform.color} opacity-70`} strokeWidth={2.5} />
                      </div>
                    </div>
                  ))}
              </div>
              
              <div className="p-4 border-t-[3px] border-primary bg-background/50 flex justify-end gap-3">
                <Button 
                  onClick={() => setIsPlatformsModalOpen(false)}
                  className="font-black uppercase tracking-widest border-[2px] border-primary shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
