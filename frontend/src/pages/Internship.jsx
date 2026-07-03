import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, CheckCircle2, XCircle, Briefcase, Trophy, FileText, Loader2, RefreshCw, UploadCloud, X, Filter, Trash2, Award, LogOut, History, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ScrollArea } from '../components/ui/scroll-area';
import axios from 'axios';

// Dynamic Subcomponent for Company Logos using Direct Domain Prediction + Clearbit
const CompanyLogo = ({ companyName }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);
  
  // Clean fallback using ui-avatars — always visible as a base layer
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=E8DFFF&color=9400FF&bold=true&size=64&font-size=0.4`;

  useEffect(() => {
    const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const overrides = {
      'phonepe': 'phonepe.com',
      'paytm': 'paytm.com',
      'atlassian': 'atlassian.com',
      'google': 'google.com',
      'cisco': 'cisco.com',
      'apple': 'apple.com',
      'uber': 'uber.com',
      'microsoft': 'microsoft.com',
      'amazon': 'amazon.com',
      'walmart': 'walmart.com'
    };
    
    const domain = overrides[cleanName] || `${cleanName}.com`;
    setLoaded(false);
    setImgSrc(`https://icon.horse/icon/${domain}?fallback=false`);
  }, [companyName]);

  return (
    <div className="w-full h-full relative">
      {/* Base Layer: Always-visible styled fallback with company initial */}
      <img 
        src={fallbackUrl} 
        alt={companyName}
        className="w-full h-full object-contain rounded-lg absolute inset-0"
      />
      {/* Top Layer: Real logo fades in once loaded, stays hidden if API fails */}
      {imgSrc && (
        <img 
          src={imgSrc} 
          alt={companyName}
          className={`w-full h-full object-contain rounded-lg absolute inset-0 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
        />
      )}
    </div>
  );
};



export default function Internship() {
  const { user } = useAuth();
  // History Toggle State
  const [showHistory, setShowHistory] = useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [appliedInternships, setAppliedInternships] = useState([]);
  const [appliedCount, setAppliedCount] = useState(0);
  
  const [opportunities, setOpportunities] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [domainFilter, setDomainFilter] = useState('all');
  const [page, setPage] = useState(1);
  const scrollViewportRef = useRef(null);

  // Resume Upload Logic
  const fileInputRef = useRef(null);
  const [resumeName, setResumeName] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Modal States
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Lifecycle Modal: { appId, step: 'selection' | 'action', app }
  const [lifecycleModal, setLifecycleModal] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAppliedData();
      fetchSavedResume();
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('preferred_domain')
      .eq('user_id', user.id)
      .single();

    if (!error && data?.preferred_domain) {
      setDomainFilter(data.preferred_domain);
    }
  };

  // Fetch when component mounts or when the domain filter changes
  useEffect(() => {
    fetchPlatforms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainFilter]);

  const fetchPlatforms = async () => {
    setLoadingOpps(true);
    setLoadingMore(false); // Reset in case a previous loadMore was flying
    setPage(1); // Reset page on new filter
    try {
      const response = await axios.get(`http://localhost:5001/api/internships?domain=${domainFilter}&page=1`);
      setOpportunities(response.data || []);
    } catch (error) {
      console.error("Failed to fetch initial internships:", error);
      setOpportunities([]); // Clear or show error state
    } finally {
      setLoadingOpps(false);
    }
  };

  const loadMorePlatforms = async () => {
    if (loadingMore || loadingOpps) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const response = await axios.get(`http://localhost:5001/api/internships?domain=${domainFilter}&page=${nextPage}`);
      if (response.data && response.data.length > 0) {
        setOpportunities(prev => [...prev, ...response.data]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to fetch more internships:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Attach native scroll listener directly to the ScrollArea viewport for reliable detection
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    // Find the actual scrollable viewport div inside ScrollArea (first child with data-radix-scroll-area-viewport)
    const scrollEl = viewport.querySelector('[data-radix-scroll-area-viewport]') || viewport;

    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = scrollEl;
      if (scrollHeight - scrollTop <= clientHeight + 80) {
        if (!loadingMore && !loadingOpps) {
          loadMorePlatforms();
        }
      }
    };

    scrollEl.addEventListener('scroll', handleScroll, { passive: true });

    // Failsafe: if content doesn't overflow after initial load, auto-trigger more
    requestAnimationFrame(() => {
      if (scrollEl.scrollHeight <= scrollEl.clientHeight + 80 && !loadingMore && !loadingOpps) {
        loadMorePlatforms();
      }
    });

    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [loadingMore, loadingOpps, domainFilter]);

  const fetchAppliedData = async () => {
    const { data, error } = await supabase
      .from('internship_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAppliedInternships(data);
      // Count only active internships (applied + selected) for the header badge
      setAppliedCount(data.filter(a => a.status === 'applied' || a.status === 'selected').length);
    }
  };

  const handleApplyClick = (internship) => {
    window.open(internship.url, '_blank');
    setSelectedInternship(internship);
    
    // Safety check to prevent double listeners
    if (window.internshipTimer) clearInterval(window.internshipTimer);

    // Multi-layered trigger for max reliability
    const triggerModal = () => {
      setShowConfirmModal(true);
      // Clean up EVERYTHING
      window.removeEventListener('focus', triggerModal);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (window.internshipTimer) clearInterval(window.internshipTimer);
      window.internshipTimer = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerModal();
      }
    };
    
    // 1. Focus listener (Works on most desktop browsers)
    // 2. VisibilityChange listener (Works on mobile and modern desktop tabs)
    // 3. POLLING FALLBACK: If the above fail, show modal after 30s anyway
    setTimeout(() => {
      window.addEventListener('focus', triggerModal);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // The "Strict" Polling Fallback - If they haven't come back in 30s, 
      // they've likely been on the other site long enough.
      window.internshipTimer = setInterval(() => {
         if (document.visibilityState === 'visible') {
           triggerModal();
         }
      }, 2000);
    }, 1500);
  };

  const handleConfirmApplication = async (didApply) => {
    if (didApply && user && selectedInternship) {
      setIsSaving(true);
      const newApp = {
        user_id: user.id,
        company: selectedInternship.company,
        title: selectedInternship.title,
        url: selectedInternship.url,
        status: 'applied'
      };

      const { data, error } = await supabase
        .from('internship_applications')
        .insert([newApp])
        .select()
        .single();

      if (error) {
        console.error("Error saving to Supabase:", error);
        alert("Failed to save. Have you created the internship_applications table?");
      } else {
        setAppliedInternships(prev => [data, ...prev]);
        setAppliedCount(prev => prev + 1);
        setOpportunities(prev => prev.filter(job => job.id !== selectedInternship.id));
      }
    }
    
    setIsSaving(false);
    setShowConfirmModal(false);
    setSelectedInternship(null);
  };

  // --- INTERNSHIP LIFECYCLE STATE MACHINE ---
  const handleLifecycleClick = (app) => {
    if (app.status === 'applied') {
      // Step 1: Ask if they got selected
      setLifecycleModal({ appId: app.id, step: 'selection', app });
    } else if (app.status === 'selected') {
      // Step 2: Ask what to do with active internship
      setLifecycleModal({ appId: app.id, step: 'action', app });
    }
    // completed/dropped are read-only — no action
  };

  const handleLifecycleAction = async (action) => {
    if (!lifecycleModal || !user) return;
    setIsSaving(true);
    const { appId } = lifecycleModal;

    try {
      if (action === 'selected') {
        // User got selected → mark as active
        const { error } = await supabase
          .from('internship_applications')
          .update({ status: 'selected', selected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', appId)
          .eq('user_id', user.id);
        if (error) throw error;
        setAppliedInternships(prev => prev.map(a => a.id === appId ? { ...a, status: 'selected', selected_at: new Date().toISOString() } : a));

      } else if (action === 'not_selected') {
        // User did NOT get selected → delete the record
        const { error } = await supabase
          .from('internship_applications')
          .delete()
          .eq('id', appId)
          .eq('user_id', user.id);
        if (error) throw error;
        setAppliedInternships(prev => prev.filter(a => a.id !== appId));
        setAppliedCount(prev => prev - 1);

      } else if (action === 'completed') {
        // Mark active internship as completed
        const { error } = await supabase
          .from('internship_applications')
          .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', appId)
          .eq('user_id', user.id);
        if (error) throw error;
        setAppliedInternships(prev => prev.map(a => a.id === appId ? { ...a, status: 'completed', completed_at: new Date().toISOString() } : a));
        setAppliedCount(prev => prev - 1); // No longer active

      } else if (action === 'dropped') {
        // User left the internship → mark as dropped
        const { error } = await supabase
          .from('internship_applications')
          .update({ status: 'dropped', dropped_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', appId)
          .eq('user_id', user.id);
        if (error) throw error;
        setAppliedInternships(prev => prev.map(a => a.id === appId ? { ...a, status: 'dropped', dropped_at: new Date().toISOString() } : a));
        setAppliedCount(prev => prev - 1); // No longer active
      }
    } catch (err) {
      console.error('Lifecycle update failed:', err);
    }

    setIsSaving(false);
    setLifecycleModal(null);
  };

  // Helper: get status-dependent styles for Applied Record cards
  const getStatusStyles = (status) => {
    switch (status) {
      case 'selected':
        return { border: 'border-green-400', bg: 'bg-green-50', label: 'WORKING', labelClass: 'bg-green-100 text-green-700 border-green-300', icon: <Award size={14} strokeWidth={3} className="text-green-600" /> };
      case 'completed':
        return { border: 'border-blue-300', bg: 'bg-blue-50/50', label: 'COMPLETED', labelClass: 'bg-blue-100 text-blue-600 border-blue-200', icon: <CheckCircle2 size={14} strokeWidth={3} className="text-blue-500" /> };
      case 'dropped':
        return { border: 'border-red-300', bg: 'bg-red-50/50', label: 'LEFT', labelClass: 'bg-red-100 text-red-600 border-red-200', icon: <LogOut size={14} strokeWidth={3} className="text-red-500" /> };
      default:
        return { border: 'border-primary/20', bg: 'bg-background', label: null, labelClass: '', icon: null };
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // --- 5MB CAP ENFORCEMENT ---
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File too large! Maximum allowed size is ${MAX_SIZE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      e.target.value = ''; // Reset the input
      return;
    }

    // --- FILE TYPE VALIDATION ---
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a PDF, DOC, or DOCX file.');
      e.target.value = '';
      return;
    }

    setIsUploadingResume(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/resume_${Date.now()}.${fileExt}`;

      // 1. Delete the old resume file from storage if it exists
      if (resumeUrl) {
        const oldPath = resumeUrl.split('/resumes/')[1];
        if (oldPath) {
          await supabase.storage.from('resumes').remove([decodeURIComponent(oldPath)]);
        }
      }

      // 2. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // 4. Persist metadata in user_settings
      const { error: dbError } = await supabase
        .from('user_settings')
        .update({ resume_name: file.name, resume_url: publicUrl })
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      // 5. Update local state
      setResumeName(file.name);
      setResumeUrl(publicUrl);
    } catch (err) {
      console.error('Resume upload failed:', err);
      alert('Failed to upload resume. Please ensure the "resumes" storage bucket exists in your Supabase dashboard.');
    } finally {
      setIsUploadingResume(false);
      e.target.value = ''; // Reset input for re-uploads
    }
  };

  // Load saved resume from DB on mount
  const fetchSavedResume = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_settings')
      .select('resume_name, resume_url')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    if (data?.resume_name) {
      setResumeName(data.resume_name);
      setResumeUrl(data.resume_url);
    }
  };

  // Delete resume from storage + DB
  const handleDeleteResume = async () => {
    if (!resumeUrl || !user) return;
    setIsUploadingResume(true);
    try {
      // Remove from storage
      const path = resumeUrl.split('/resumes/')[1];
      if (path) {
        await supabase.storage.from('resumes').remove([decodeURIComponent(path)]);
      }
      // Clear DB reference
      await supabase.from('user_settings')
        .update({ resume_name: null, resume_url: null })
        .eq('user_id', user.id);

      setResumeName(null);
      setResumeUrl(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const cardStyle = "bg-card border-[3px] md:border-[4px] border-primary rounded-[2rem] shadow-[6px_6px_0px_var(--tw-shadow-color)] md:shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary p-4 md:p-6 transition-all duration-300";

  return (
    <motion.div 
      style={{ height: 'calc(100vh - 120px)' }}
      className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 md:gap-6 relative z-10 font-sans min-h-[600px]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Header Row (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 shrink-0 h-[100px] md:h-[120px]">
        {/* Total Applied Stat / History Toggle */}
        <motion.div variants={itemVariants} className={`${cardStyle} flex flex-row items-center justify-between h-full group relative`}>
          <div className="flex flex-col justify-center flex-1">
            <h3 className="font-handwriting text-primary text-2xl md:text-3xl lg:text-4xl uppercase tracking-wider leading-none">
              {showHistory ? 'History' : 'Applied'}
            </h3>
            <p className="text-muted-foreground font-black text-[10px] md:text-xs uppercase tracking-widest mt-1">
              {showHistory ? 'Past Records' : 'Lifetime Tracker'}
            </p>
          </div>
          <div className="relative z-50">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-[1rem] flex items-center justify-center transition-all duration-300 shadow-[4px_4px_0px_var(--tw-shadow-color)] shrink-0 mx-2 active:translate-y-1 active:shadow-none ${
                showHistory 
                  ? 'bg-amber-100 text-amber-600 border-2 border-amber-300 shadow-amber-200' 
                  : 'bg-primary text-primary-foreground border-2 border-primary/20 shadow-primary/20 hover:-rotate-3'
              }`}
            >
              {showHistory ? <History size={24} strokeWidth={3} /> : <span className="text-2xl md:text-3xl font-black">{appliedCount}</span>}
            </button>
          </div>
        </motion.div>

        {/* Domain Filter Custom Dropdown */}
        <motion.div 
          variants={itemVariants} 
          className={`${cardStyle} flex flex-row items-center justify-between h-full gap-4 relative ${showDomainDropdown ? 'z-[100]' : 'z-10'}`}
        >
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <h3 className="font-handwriting text-primary text-2xl md:text-3xl lg:text-4xl uppercase tracking-wider leading-none">Domain</h3>
            <p className="text-muted-foreground font-black text-[10px] md:text-xs uppercase tracking-widest mt-1 truncate">
              {domainFilter === 'all' ? 'Filtering' : domainFilter}
            </p>
          </div>
          
          <div className="relative z-50">
            <button
               onClick={() => setShowDomainDropdown(!showDomainDropdown)}
               className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl border-2 border-primary shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 font-black text-[10px] md:text-sm uppercase tracking-widest min-w-[140px] justify-between"
            >
              <span className="truncate max-w-[80px]">
                {domainFilter === 'all' ? 'All' : domainFilter}
              </span>
              <Filter size={14} strokeWidth={3} className={`transition-transform duration-300 ${showDomainDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showDomainDropdown && (
                <>
                  {/* Backdrop for closing */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowDomainDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-48 bg-background border-[3px] border-primary rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden z-50 p-2 space-y-1"
                  >
                    {[
                      { id: 'all', label: 'All Domains', icon: <Briefcase size={14} /> },
                      { id: 'software', label: 'Software Eng.', icon: <Award size={14} /> },
                      { id: 'data', label: 'Data Science', icon: <FileText size={14} /> },
                      { id: 'design', label: 'Design & UI', icon: <Filter size={14} /> },
                      { id: 'marketing', label: 'Marketing', icon: <Trophy size={14} /> },
                      { id: 'management', label: 'Management', icon: <LogOut size={14} /> }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={async () => {
                          setDomainFilter(opt.id);
                          setShowDomainDropdown(false);
                          // Persist to DB
                          if (user) {
                            await supabase
                              .from('user_settings')
                              .update({ preferred_domain: opt.id })
                              .eq('user_id', user.id);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors ${
                          domainFilter === opt.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-primary/10 text-primary/80'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Dynamic Resume Sync Button */}
        <motion.div 
          variants={itemVariants} 
          onClick={() => setShowResumeModal(true)}
          className={`${cardStyle} flex flex-row items-center justify-between cursor-pointer hover:-translate-y-1 hover:shadow-[10px_10px_0px_var(--tw-shadow-color)] hover:shadow-primary active:translate-y-0 active:shadow-none overflow-hidden h-full`}
        >
          <div className="flex flex-col justify-center">
            <h3 className="font-handwriting text-primary text-2xl md:text-3xl lg:text-4xl capitalize tracking-wider leading-none">
              {isUploadingResume ? 'Syncing...' : 'Resume'}
            </h3>
            <p className={`font-black text-[10px] md:text-xs uppercase tracking-widest mt-1 truncate max-w-[120px] md:max-w-[160px] ${resumeName && !isUploadingResume ? 'text-green-600' : 'text-muted-foreground'}`}>
              {resumeName && !isUploadingResume ? resumeName : 'Upload & Sync'}
            </p>
          </div>
          {isUploadingResume ? (
             <Loader2 className="animate-spin text-primary w-8 h-8 md:w-10 md:h-10 shrink-0 mx-2" />
          ) : (
             <FileText className={`shrink-0 mx-2 w-8 h-8 md:w-10 md:h-10 transition-colors ${resumeName ? 'text-green-600 opacity-100' : 'text-primary opacity-80'}`} />
          )}
          
          <input 
            type="file" 
            accept=".pdf,.doc,.docx" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleResumeUpload} 
          />
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6 flex-1 min-h-0">
        {/* Left Panel: Internship Opportunities Feed */}
        <motion.div variants={itemVariants} className={`${cardStyle} flex-[2] flex flex-col h-full overflow-hidden`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b-4 border-primary/10 pb-3 shrink-0 gap-2">
            <div>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-handwriting text-primary uppercase leading-none mt-1">
                INTERNSHIP FEED
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-green-100 text-green-700 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse border-2 border-green-300">Live</span>
                <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {domainFilter === 'all' ? 'Aggregated from Unstop & Internshala' : `Filtered: ${domainFilter.toUpperCase()} DOMAIN`}
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 w-full" scrollHideDelay={300} ref={scrollViewportRef}>
            <div className="w-full min-w-0 grid grid-cols-1 gap-y-3 md:gap-y-4 pb-4 pr-3 lg:pr-4">
              {loadingOpps ? (
                <div className="flex flex-col items-center justify-center text-primary/50 pt-10">
                  <Loader2 className="animate-spin mb-4" size={48} />
                  <p className="font-handwriting text-2xl uppercase">Crunching Data...</p>
                </div>
              ) : opportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-primary/50 p-4 pt-10">
                  <p className="font-handwriting text-2xl md:text-3xl">All caught up!</p>
                  <p className="font-bold text-sm md:text-base mt-2">No more openings in this domain for now.</p>
                </div>
              ) : (
                opportunities.map((job) => (
                  <div key={job.id} className="w-full min-w-0 bg-background border-[3px] border-primary/20 hover:border-primary/80 rounded-[1.5rem] p-4 md:p-5 flex flex-col xl:flex-row items-start xl:items-center justify-between transition-all duration-300 group shadow-sm hover:shadow-[4px_4px_0px_var(--tw-shadow-color)] hover:shadow-primary/30 gap-4">
                    <div className="flex-1 flex flex-row items-center min-w-0 overflow-hidden gap-3 md:gap-4">
                      
                      {/* Render Smart React Subcomponent mapped by pure string */}
                      <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-primary/5 rounded-2xl border-[3px] border-primary/10 overflow-hidden flex items-center justify-center bg-white shadow-sm px-2">
                         <CompanyLogo companyName={job.company} />
                      </div>
                      
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border-2 ${
                            job.platform === 'Unstop' 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-orange-100 text-orange-700 border-orange-200'
                          }`}>
                            {job.platform}
                          </span>
                          <span className="text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-widest bg-primary/5 px-2 py-1 border border-primary/10 rounded-md whitespace-nowrap">
                            {job.stipend}
                          </span>
                        </div>
                        <h4 className="font-black text-lg md:text-xl lg:text-2xl text-foreground tracking-tight leading-tight truncate">{job.title}</h4>
                        <p className="text-muted-foreground font-bold text-xs md:text-sm tracking-wide mt-1 truncate">
                          {job.company} • {job.location}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleApplyClick(job)}
                      className="w-full xl:w-auto bg-primary text-primary-foreground font-black tracking-widest px-5 py-2.5 md:px-6 md:py-3 rounded-xl shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary-foreground/30 hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--tw-shadow-color)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                    >
                      APPLY <ExternalLink size={16} strokeWidth={3} />
                    </button>
                  </div>
                ))
              )}
              
              {loadingMore && !loadingOpps && (
                <div className="w-full flex justify-center py-4 text-primary/50">
                  <Loader2 className="animate-spin w-8 h-8" strokeWidth={3} />
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardStyle} flex-1 flex flex-col bg-primary/5 border-primary/50 h-full overflow-hidden`}>
          <div className="flex items-center justify-between mb-3 shrink-0 border-b-4 border-primary/10 pb-3">
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
               <Briefcase className="text-primary w-6 h-6 md:w-7 md:h-7 shrink-0" strokeWidth={2.5}/>
               <h2 className="text-2xl md:text-3xl font-handwriting text-primary capitalize leading-none pt-1 truncate">
                 {showHistory ? 'History' : 'Applied Record'}
               </h2>
            </div>
            {showHistory && (
              <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-300 uppercase tracking-widest shrink-0">Archive</span>
            )}
          </div>
          
          <ScrollArea className="flex-1 w-full pr-2">
            <div className="space-y-2 md:space-y-3 pb-4">
              {appliedInternships.filter(app => 
                showHistory 
                  ? ['completed', 'dropped'].includes(app.status)
                  : ['applied', 'selected'].includes(app.status)
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center opacity-50 p-4 pt-10">
                  {showHistory ? <History size={40} className="text-primary mb-4" /> : <Trophy size={40} className="text-primary mb-4" strokeWidth={1.5}/>}
                  <p className="font-bold text-xs md:text-sm">
                    {showHistory ? 'No past records found.' : 'No active applications tracked yet.'}
                  </p>
                  {!showHistory && <p className="text-[10px] mt-1">Start applying to build your record!</p>}
                </div>
              ) : (
                appliedInternships
                  .filter(app => 
                    showHistory 
                      ? ['completed', 'dropped'].includes(app.status)
                      : ['applied', 'selected'].includes(app.status)
                  )
                  .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                  .map(app => {
                  const styles = getStatusStyles(app.status);
                  const isActionable = app.status === 'applied' || app.status === 'selected';
                  return (
                    <div key={app.id} className={`group ${styles.bg} border-[3px] ${styles.border} rounded-2xl p-3 md:p-4 flex flex-row items-center justify-between gap-3 transition-all duration-300 ${isActionable ? 'hover:shadow-md cursor-pointer' : 'opacity-80'}`}>
                     
                     {/* Company Logo */}
                      <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-primary/5 rounded-xl border-[3px] border-primary/10 overflow-hidden flex items-center justify-center bg-white shadow-sm px-1.5">
                         <CompanyLogo companyName={app.company} />
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-black text-xs md:text-sm text-foreground leading-tight truncate">{app.title}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] md:text-xs text-muted-foreground font-bold tracking-widest uppercase truncate">{app.company}</p>
                          {styles.label && (
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border-[1.5px] flex items-center gap-0.5 shrink-0 ${styles.labelClass}`}>
                              {styles.icon} {styles.label}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Area — only for actionable statuses */}
                      {isActionable && (
                        <div className="relative flex items-center justify-center w-auto h-6 md:h-8 shrink-0">
                          {app.status === 'applied' && (
                            <>
                              <CheckCircle2 className="text-primary absolute right-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-50 w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
                              <button 
                                onClick={() => handleLifecycleClick(app)}
                                className="absolute right-0 opacity-0 scale-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 px-2 py-1 md:px-3 md:py-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary/30 rounded-lg flex items-center justify-center z-10 font-black text-[9px] md:text-[10px] uppercase tracking-widest"
                              >
                                DONE
                              </button>
                            </>
                          )}
                          {app.status === 'selected' && (
                            <>
                              <Award className="text-green-600 absolute right-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-50 w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                              <button 
                                onClick={() => handleLifecycleClick(app)}
                                className="absolute right-0 opacity-0 scale-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 px-2 py-1 md:px-3 md:py-1.5 bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300 rounded-lg flex items-center justify-center z-10 font-black text-[9px] md:text-[10px] uppercase tracking-widest"
                              >
                                UPDATE
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>

      {/* Confirmation Modal - Apply */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-lg border-[4px] border-primary rounded-[2.5rem] shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-6 md:p-8 text-center"
            >
              <h3 className="text-3xl md:text-4xl font-handwriting text-primary mb-2">Welcome Back!</h3>
              <p className="font-bold text-base md:text-lg text-foreground mb-6 md:mb-8">
                Did you successfully apply for the <span className="text-primary italic">{selectedInternship?.title}</span> position at {selectedInternship?.company}?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <button 
                  disabled={isSaving}
                  onClick={() => handleConfirmApplication(true)}
                  className="w-full bg-primary text-primary-foreground font-black tracking-widest px-4 py-3 md:px-6 md:py-4 rounded-xl shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs md:text-base"
                >
                  <CheckCircle2 size={20} /> YES, I APPLIED
                </button>
                <button 
                  disabled={isSaving}
                  onClick={() => handleConfirmApplication(false)}
                  className="w-full bg-background text-primary border-[3px] md:border-[4px] border-primary/30 font-black tracking-widest px-4 py-3 md:px-6 md:py-4 rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2 hover:border-primary disabled:opacity-50 text-xs md:text-base"
                >
                  <XCircle size={20} /> NO, NOT YET
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lifecycle Modal — 2-step flow */}
      <AnimatePresence>
        {lifecycleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            {/* Step 1: Selection Question (for APPLIED status) */}
            {lifecycleModal.step === 'selection' && (
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card w-full max-w-md border-[4px] border-secondary rounded-[2.5rem] shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-secondary/50 p-6 md:p-8 text-center"
              >
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-secondary/20">
                  <Award size={32} className="text-secondary" strokeWidth={2} />
                </div>
                <h3 className="text-2xl md:text-3xl font-handwriting text-primary mb-2">Got Selected?</h3>
                <p className="font-bold text-sm md:text-base text-foreground mb-2">
                  Did you get selected for the <span className="text-secondary italic">{lifecycleModal.app?.title}</span> position at {lifecycleModal.app?.company}?
                </p>
                <p className="text-[11px] text-muted-foreground mb-6">Selecting "No" will remove this from your tracking list.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    disabled={isSaving}
                    onClick={() => handleLifecycleAction('selected')}
                    className="w-full bg-green-500 text-white font-black tracking-widest px-4 py-3 md:py-4 rounded-xl shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-green-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs md:text-base"
                  >
                    <CheckCircle2 size={20} /> YES, SELECTED!
                  </button>
                  <button 
                    disabled={isSaving}
                    onClick={() => handleLifecycleAction('not_selected')}
                    className="w-full bg-background text-red-500 border-[3px] border-red-200 font-black tracking-widest px-4 py-3 md:py-4 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 hover:border-red-400 disabled:opacity-50 text-xs md:text-base"
                  >
                    <XCircle size={20} /> NO, REMOVE
                  </button>
                </div>
                <button onClick={() => setLifecycleModal(null)} disabled={isSaving} className="mt-4 text-muted-foreground font-bold text-sm hover:text-foreground transition-colors uppercase tracking-widest disabled:opacity-50">Cancel</button>
              </motion.div>
            )}

            {/* Step 2: Action Choice (for SELECTED status) */}
            {lifecycleModal.step === 'action' && (
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card w-full max-w-md border-[4px] border-green-500 rounded-[2.5rem] shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-green-500/50 p-6 md:p-8 text-center"
              >
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-300">
                  <Briefcase size={32} className="text-green-600" strokeWidth={2} />
                </div>
                <h3 className="text-2xl md:text-3xl font-handwriting text-green-600 mb-2">Update Internship</h3>
                <p className="font-bold text-sm md:text-base text-foreground mb-6">
                  What's the status of your <span className="text-green-600 italic">{lifecycleModal.app?.title}</span> role at {lifecycleModal.app?.company}?
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    disabled={isSaving}
                    onClick={() => handleLifecycleAction('completed')}
                    className="w-full bg-blue-500 text-white font-black tracking-widest px-4 py-3 md:py-4 rounded-xl shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-blue-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs md:text-base"
                  >
                    <CheckCircle2 size={20} /> MARK AS COMPLETED
                  </button>
                  <button 
                    disabled={isSaving}
                    onClick={() => handleLifecycleAction('dropped')}
                    className="w-full bg-background text-red-500 border-[3px] border-red-200 font-black tracking-widest px-4 py-3 md:py-4 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 hover:border-red-400 disabled:opacity-50 text-xs md:text-base"
                  >
                    <LogOut size={20} /> LEAVE INTERNSHIP
                  </button>
                </div>
                <button onClick={() => setLifecycleModal(null)} disabled={isSaving} className="mt-4 text-muted-foreground font-bold text-sm hover:text-foreground transition-colors uppercase tracking-widest disabled:opacity-50">Cancel</button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Hub Modal */}
      <AnimatePresence>
        {showResumeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-sm border-[4px] border-primary rounded-[2.5rem] shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-6 md:p-8 text-center flex flex-col items-center"
            >
              <div className="bg-primary/10 p-5 rounded-full mb-4 border-2 border-primary/20">
                <FileText size={48} className="text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl md:text-4xl font-handwriting text-primary mb-1">Resume Hub</h3>
              <p className="font-bold text-sm text-muted-foreground mb-1 truncate w-full px-4">
                {resumeName ? `Current: ${resumeName}` : 'No resume synced.'}
              </p>
              <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-5">Max file size: 5MB • PDF, DOC, DOCX</p>
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => window.open(resumeUrl, '_blank')}
                  disabled={!resumeUrl || isUploadingResume}
                  className="w-full bg-primary text-primary-foreground font-black tracking-widest px-4 py-3.5 rounded-xl shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  <ExternalLink size={18} strokeWidth={3}/> VIEW DOC
                </button>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingResume}
                  className="w-full bg-background text-primary border-[3px] border-primary/30 font-black tracking-widest px-4 py-3.5 rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2 hover:border-primary disabled:opacity-50 text-sm"
                >
                   {isUploadingResume ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} strokeWidth={3} />} 
                   {resumeName ? 'REPLACE RESUME' : 'UPLOAD NEW'}
                </button>

                {resumeName && (
                  <button 
                    onClick={handleDeleteResume}
                    disabled={isUploadingResume}
                    className="w-full bg-red-50 text-red-600 border-[3px] border-red-200 font-black tracking-widest px-4 py-3 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 hover:border-red-400 disabled:opacity-50 text-sm"
                  >
                    <Trash2 size={16} strokeWidth={3} /> DELETE RESUME
                  </button>
                )}
                
                <button 
                  onClick={() => setShowResumeModal(false)}
                  className="w-full mt-2 bg-transparent text-muted-foreground font-bold tracking-widest px-4 py-2 hover:text-foreground transition-all text-sm uppercase"
                >
                   CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
