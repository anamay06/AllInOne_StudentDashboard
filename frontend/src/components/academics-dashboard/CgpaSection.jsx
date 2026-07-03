import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Calendar, GraduationCap, Plus } from 'lucide-react';
import TargetCgpaCalculator from './TargetCgpaCalculator';
import SemesterSgpaModal from './SemesterSgpaModal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function CgpaSection() {
  const { user } = useAuth();
  const [cgpa, setCgpa] = useState(0.00);
  const [currentSgpa, setCurrentSgpa] = useState(0);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).limit(1);
    if (data && data.length > 0) {
      const row = data[0];
      if (row.cgpa !== undefined) setCgpa(Number(row.cgpa));
      
      // Determine latest non-zero SGPA
      let latest = 0;
      for (let i = 8; i >= 1; i--) {
        if (row[`sgpa${i}`] > 0) {
          latest = Number(row[`sgpa${i}`]);
          break;
        }
      }
      setCurrentSgpa(latest);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('cgpa-updated', fetchData);
    return () => window.removeEventListener('cgpa-updated', fetchData);
  }, [user]);

  return (
    <motion.div variants={sectionVariants} className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-4 relative overflow-hidden">
      {/* Decorative gradient blob background (optional, for aesthetics) */}
      <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold flex items-center gap-3 font-sans">
            <GraduationCap className="h-8 w-8 text-primary" />
            CGPA
          </h2>
          <div className="mt-6 flex flex-col sm:flex-row items-baseline gap-4 font-mono">
            <span className="text-5xl sm:text-6xl font-black tracking-tight flex items-baseline gap-2">
              Overall CGPA: <span className="text-primary text-6xl">{typeof cgpa === 'number' ? cgpa.toFixed(2) : cgpa}</span><span className="text-4xl text-muted-foreground font-semibold"> / 10.0</span>
            </span>
          </div>
        </div>
        
      </div>

      <div className="mt-6 flex flex-wrap gap-6 items-center justify-between border-t border-border/50 pt-6">
        <div 
          onClick={() => setIsCalculatorOpen(true)}
          className="text-xl text-muted-foreground flex items-center gap-3 font-mono hover:text-primary cursor-pointer transition-colors font-semibold"
        >
          <Calculator className="h-6 w-6" /> Explore Target CGPA Calculator
        </div>
        <div className="flex items-center gap-6">
          <div className="font-mono font-bold text-foreground text-lg bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
            Current SGPA: <span className="text-primary">{currentSgpa > 0 ? currentSgpa.toFixed(2) : '--'}</span>
          </div>
          <button 
            onClick={() => setIsSemesterModalOpen(true)}
            className="px-6 py-3 bg-transparent border border-primary/20 hover:border-primary/50 text-foreground font-medium rounded-xl text-lg transition-all hover:bg-primary/5">
            View Semester Wise
          </button>
        </div>
      </div>

      <TargetCgpaCalculator 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
      />

      <SemesterSgpaModal 
        isOpen={isSemesterModalOpen} 
        onClose={() => setIsSemesterModalOpen(false)} 
      />
    </motion.div>
  );
}
