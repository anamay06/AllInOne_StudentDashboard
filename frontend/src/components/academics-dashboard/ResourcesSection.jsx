import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CalendarDays, Clock3, Download, FileText, Calendar as CalIcon, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function ResourcesSection() {
  const { user } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({ timetable: null, calendar: null, syllabus: null });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPdf(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch existing PDFs from storage on mount
  useEffect(() => {
    const fetchPdfs = async () => {
      if (!user) return;
      
      const { data: listData, error } = await supabase.storage.from('academic_resources').list(user.id);
      
      if (listData && !error) {
        const fetchedStats = { timetable: null, calendar: null, syllabus: null };
        const resources = ['timetable', 'calendar', 'syllabus'];
        
        resources.forEach(res => {
          const fileExists = listData.find(f => f.name === `${res}.pdf`);
          if (fileExists) {
            const { data: urlData } = supabase.storage.from('academic_resources').getPublicUrl(`${user.id}/${res}.pdf`);
            fetchedStats[res] = `${urlData.publicUrl}?t=${new Date().getTime()}`;
          }
        });
        
        setUploadedFiles(fetchedStats);
      }
    };
    fetchPdfs();
  }, [user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPdf || !user) return;
    
    setIsUploading(true);
    
    // Upload to bucket: bucket/user_id/res_id.pdf
    const filePath = `${user.id}/${selectedPdf.id}.pdf`;
    
    const { data, error } = await supabase.storage
      .from('academic_resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Crucial for Overwriting functionality as requested
      });
      
    if (error) {
       console.error("Storage upload error:", error);
       alert("Failed to upload: " + error.message + " (Please ensure the 'academic_resources' public storage bucket is created via SQL)");
    } else {
       // Refresh public url with timestamp cache-buster
       const { data: urlData } = supabase.storage.from('academic_resources').getPublicUrl(filePath);
       const newUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
       
       setUploadedFiles(prev => ({ ...prev, [selectedPdf.id]: newUrl }));
       setSelectedPdf(prev => prev ? { ...prev, src: newUrl, isImage: false } : null);
    }
    
    setIsUploading(false);
  };

  const pdfData = {
    timetable: { id: 'timetable', title: 'Weekly Timetable', src: uploadedFiles.timetable, isImage: false },
    calendar: { id: 'calendar', title: 'Academic Calendar', src: uploadedFiles.calendar, isImage: false },
    syllabus: { id: 'syllabus', title: 'Detailed Syllabus Booklet', src: uploadedFiles.syllabus, isImage: false }
  };

  return (
    <motion.div variants={sectionVariants} className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-6 min-h-0 font-jetbrains">
      <h2 className="text-2xl font-bold flex items-center gap-3 font-jetbrains">
        <BookOpen className="h-8 w-8 text-primary" />
        Academic Resources
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Weekly Timetable */}
        <Button asChild variant="outline" className="h-auto w-full min-h-[150px] rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 shadow-md transition-all [&_svg]:size-10">
          <motion.button 
            onClick={() => setSelectedPdf(pdfData.timetable)}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center justify-center gap-3"
          >
            <Clock3 className="text-primary mb-1" />
            <h3 className="font-bold text-lg font-jetbrains text-foreground whitespace-normal">Weekly Timetable</h3>
          </motion.button>
        </Button>

        {/* Academic Calendar */}
        <Button asChild variant="outline" className="h-auto w-full min-h-[150px] rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 shadow-md transition-all [&_svg]:size-10">
          <motion.button 
            onClick={() => setSelectedPdf(pdfData.calendar)}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center justify-center gap-3"
          >
            <CalendarDays className="text-primary mb-1" />
            <h3 className="font-bold text-lg font-jetbrains text-foreground whitespace-normal">Academic Calendar</h3>
          </motion.button>
        </Button>

        {/* Detailed Syllabus Booklet */}
        <Button asChild variant="outline" className="h-auto w-full min-h-[150px] rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 shadow-md transition-all [&_svg]:size-10">
          <motion.button 
            onClick={() => setSelectedPdf(pdfData.syllabus)}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center justify-center gap-3"
          >
            <FileText className="text-primary mb-1" />
            <h3 className="font-bold text-lg font-jetbrains text-foreground whitespace-normal">Detailed Syllabus</h3>
          </motion.button>
        </Button>

      </div>

      {/* PDF Modal */}
      <AnimatePresence>
        {selectedPdf && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-[280px] bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedPdf(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full lg:w-[95%] max-w-[1500px] h-[92vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {selectedPdf.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isUploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => setSelectedPdf(null)}
                    className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-muted/10 relative overflow-hidden flex p-6">
                {selectedPdf.src ? (
                  <iframe 
                    src={selectedPdf.src} 
                    className="w-full h-full relative z-10 bg-white rounded-lg shadow-sm"
                    title={selectedPdf.title}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-muted-foreground tracking-tight">{selectedPdf.title}</p>
                    <p className="text-sm text-primary font-bold mt-4 px-4 py-2 bg-primary/10 rounded-full uppercase tracking-wider">Please use the Upload PDF button above</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
