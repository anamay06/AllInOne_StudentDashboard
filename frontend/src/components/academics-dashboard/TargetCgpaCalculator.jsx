import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, AlertCircle, CheckCircle2, Plus, Minus, Flame } from 'lucide-react';

export default function TargetCgpaCalculator({ isOpen, onClose }) {
  const [currentCgpa, setCurrentCgpa] = useState(8.9);
  const [targetCgpa, setTargetCgpa] = useState(9.0);
  const [completedCredits, setCompletedCredits] = useState(100);
  const [totalCredits, setTotalCredits] = useState(160);

  const remainingCredits = Math.max(0, totalCredits - completedCredits);
  const requiredGpa = remainingCredits > 0 ? ((targetCgpa * totalCredits) - (currentCgpa * completedCredits)) / remainingCredits : 0;

  const isImpossible = requiredGpa > 10;
  const isEffort = requiredGpa >= 8.5 && requiredGpa <= 10.0;
  const isAchievable = requiredGpa >= 7.0 && requiredGpa < 8.5;
  const isEasy = requiredGpa > 0 && requiredGpa < 7.0;
  const isGuaranteed = requiredGpa <= 0;
  
  const formattedRequired = requiredGpa.toFixed(2);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-[0_0_40px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden font-jetbrains"
          >
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-2xl flex items-center gap-3 font-jetbrains text-foreground">
                <Target className="h-7 w-7 text-primary" />
                Target CGPA
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-secondary/20 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-8 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                 <div className="flex flex-col gap-3">
                   <label className="text-sm font-bold text-primary uppercase tracking-wider font-jetbrains">Current CGPA</label>
                   <div className="flex items-center gap-3 bg-muted/5 p-3 rounded-2xl border border-primary/20 shadow-sm">
                     <button onClick={() => setCurrentCgpa(prev => Math.max(0, prev - 0.01))} className="p-1 hover:bg-primary/10 rounded-lg text-primary/70 hover:text-primary transition-colors"><Minus className="h-5 w-5" /></button>
                     <input type="range" min="0" max="10" step="0.01" value={currentCgpa} onChange={e => setCurrentCgpa(parseFloat(e.target.value))} className="flex-1 cursor-pointer accent-primary" />
                     <button onClick={() => setCurrentCgpa(prev => Math.min(10, prev + 0.01))} className="p-1 hover:bg-primary/10 rounded-lg text-primary/70 hover:text-primary transition-colors"><Plus className="h-5 w-5" /></button>
                     <span className="font-mono font-black text-2xl w-20 text-right pr-2 text-primary">{currentCgpa.toFixed(2)}</span>
                   </div>
                 </div>

                 <div className="flex flex-col gap-3">
                   <label className="text-sm font-bold text-secondary uppercase tracking-wider font-jetbrains">Target CGPA</label>
                   <div className="flex items-center gap-3 bg-secondary/5 p-3 rounded-2xl border border-secondary/20 shadow-sm">
                     <button onClick={() => setTargetCgpa(prev => Math.max(0, prev - 0.01))} className="p-1 hover:bg-secondary/10 rounded-lg text-secondary/70 hover:text-secondary transition-colors"><Minus className="h-5 w-5" /></button>
                     <input type="range" min="0" max="10" step="0.01" value={targetCgpa} onChange={e => setTargetCgpa(parseFloat(e.target.value))} className="flex-1 cursor-pointer accent-secondary" />
                     <button onClick={() => setTargetCgpa(prev => Math.min(10, prev + 0.01))} className="p-1 hover:bg-secondary/10 rounded-lg text-secondary/70 hover:text-secondary transition-colors"><Plus className="h-5 w-5" /></button>
                     <span className="font-mono font-black text-2xl w-20 text-right pr-2 text-secondary tracking-tight">{targetCgpa.toFixed(2)}</span>
                   </div>
                 </div>

                 <div className="flex flex-col gap-3">
                   <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider font-jetbrains">Completed Credits</label>
                   <div className="flex items-center gap-3 bg-muted/5 p-3 rounded-2xl border border-border shadow-sm">
                     <button onClick={() => setCompletedCredits(prev => Math.max(0, prev - 1))} className="p-1 hover:bg-muted/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Minus className="h-5 w-5" /></button>
                     <input type="range" min="0" max="250" step="1" value={completedCredits} onChange={e => setCompletedCredits(parseInt(e.target.value))} className="flex-1 cursor-pointer accent-muted-foreground" />
                     <button onClick={() => setCompletedCredits(prev => Math.min(250, prev + 1))} className="p-1 hover:bg-muted/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Plus className="h-5 w-5" /></button>
                     <span className="font-mono font-black text-2xl w-16 text-right pr-2 text-foreground">{completedCredits}</span>
                   </div>
                 </div>

                 <div className="flex flex-col gap-3">
                   <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider font-jetbrains">Total Credits (Degree)</label>
                   <div className="flex items-center gap-3 bg-muted/5 p-3 rounded-2xl border border-border shadow-sm">
                     <button onClick={() => setTotalCredits(prev => Math.max(1, prev - 1))} className="p-1 hover:bg-muted/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Minus className="h-5 w-5" /></button>
                     <input type="range" min="1" max="250" step="1" value={totalCredits} onChange={e => setTotalCredits(parseInt(e.target.value))} className="flex-1 cursor-pointer accent-muted-foreground" />
                     <button onClick={() => setTotalCredits(prev => Math.min(250, prev + 1))} className="p-1 hover:bg-muted/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Plus className="h-5 w-5" /></button>
                     <span className="font-mono font-black text-2xl w-16 text-right pr-2 text-foreground">{totalCredits}</span>
                   </div>
                 </div>
              </div>

              <div className={`mt-2 p-8 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-3 transition-colors ${remainingCredits === 0 ? 'bg-primary/5 border-primary/20 shadow-inner' : isImpossible ? 'bg-destructive/5 border-destructive/20' : isEffort ? 'bg-orange-500/5 border-orange-500/20 shadow-inner' : 'bg-primary/5 border-primary/20 shadow-inner'}`}>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest font-jetbrains">{remainingCredits === 0 ? 'Degree Status' : 'Required Next Semester'}</p>
                <div className={`text-7xl font-black tracking-tighter font-mono ${remainingCredits === 0 ? 'text-primary' : isImpossible ? 'text-destructive' : isEffort ? 'text-orange-500' : 'text-primary'}`}>
                  {remainingCredits === 0 ? 'Done!' : isImpossible ? '> 10.0' : isGuaranteed ? 'Skip!' : formattedRequired}
                </div>
                
                {remainingCredits === 0 ? (
                  <p className="flex items-center gap-2 text-primary font-semibold mt-2 font-jetbrains">
                    <CheckCircle2 className="h-5 w-5" /> Credits Completed
                  </p>
                ) : isImpossible ? (
                  <p className="flex items-center gap-2 text-destructive font-semibold mt-2 font-jetbrains">
                    <AlertCircle className="h-5 w-5" /> Impossible to achieve!
                  </p>
                ) : isEffort ? (
                  <p className="flex items-center gap-2 text-orange-500 font-semibold mt-2 font-jetbrains">
                    <Flame className="h-5 w-5" /> Requires efforts to achieve!
                  </p>
                ) : isAchievable ? (
                  <p className="flex items-center gap-2 text-primary font-semibold mt-2 font-jetbrains">
                    <CheckCircle2 className="h-5 w-5" /> Achievable
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-green-500 font-semibold mt-2 font-jetbrains">
                    <CheckCircle2 className="h-5 w-5" /> Easy to achieve!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
