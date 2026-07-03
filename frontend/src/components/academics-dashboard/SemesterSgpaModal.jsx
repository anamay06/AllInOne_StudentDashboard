import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function SemesterSgpaModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [sgpas, setSgpas] = useState(['', '', '', '', '', '', '', '']);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing SGPA values when modal opens
  useEffect(() => {
    if (user && isOpen) {
      fetchSgpas();
    }
  }, [user, isOpen]);

  const fetchSgpas = async () => {
    if (!user) return;
    
    // Use .select().limit(1) to avoid the "multiple rows" crash
    const { data, error } = await supabase
      .from('user_settings')
      .select('sgpa1, sgpa2, sgpa3, sgpa4, sgpa5, sgpa6, sgpa7, sgpa8')
      .eq('user_id', user.id)
      .limit(1);
    
    if (error) {
      console.error('[SGPA] Fetch error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const row = data[0];
      const values = [];
      for (let i = 1; i <= 8; i++) {
        const val = Number(row[`sgpa${i}`]) || 0;
        values.push(val > 0 ? val.toString() : '');
      }
      setSgpas(values);
    }
  };

  const handleChange = (index, value) => {
    const updated = [...sgpas];
    updated[index] = value;
    setSgpas(updated);
  };

  // Live CGPA preview
  const getLiveCgpa = () => {
    let total = 0;
    let count = 0;
    sgpas.forEach(val => {
      const num = parseFloat(val) || 0;
      if (num > 0) {
        total += num;
        count++;
      }
    });
    return count > 0 ? (total / count).toFixed(2) : '0.00';
  };

  const saveSgpas = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // 1. Read old CGPA for trend — use .limit(1) to avoid crash
      const { data: oldData } = await supabase
        .from('user_settings')
        .select('cgpa')
        .eq('user_id', user.id)
        .limit(1);
      
      const oldCgpa = (oldData && oldData.length > 0) ? Number(oldData[0].cgpa) || 0 : 0;

      // 2. Build payload
      const payload = {
        user_id: user.id,
        sgpa1: 0, sgpa2: 0, sgpa3: 0, sgpa4: 0,
        sgpa5: 0, sgpa6: 0, sgpa7: 0, sgpa8: 0
      };
      
      let totalSgpa = 0;
      let count = 0;

      for (let i = 0; i < 8; i++) {
        const numVal = parseFloat(sgpas[i]) || 0;
        payload[`sgpa${i + 1}`] = numVal;
        if (numVal > 0) {
          totalSgpa += numVal;
          count++;
        }
      }

      // 3. Calculate CGPA
      const newCgpa = count > 0 ? parseFloat((totalSgpa / count).toFixed(2)) : 0;
      payload.cgpa = newCgpa;

      // 4. Trend
      if (newCgpa > oldCgpa) payload.cgpa_trend = 'up';
      else if (newCgpa < oldCgpa) payload.cgpa_trend = 'down';
      else payload.cgpa_trend = 'neutral';

      console.log('[SGPA SAVE] Writing payload:', JSON.stringify(payload));

      // 5. UPDATE the row — works with or without duplicates
      const { data: updatedRows, error: updateErr } = await supabase
        .from('user_settings')
        .update(payload)
        .eq('user_id', user.id)
        .select();

      console.log('[SGPA SAVE] Update result:', updatedRows, 'Error:', updateErr);

      if (updateErr) {
        console.error('[SGPA SAVE] Update failed:', updateErr);
        alert('Save failed: ' + updateErr.message);
        setIsSaving(false);
        return;
      }

      if (!updatedRows || updatedRows.length === 0) {
        console.error('[SGPA SAVE] No rows updated — row may not exist');
        alert('Save failed: No matching row found.');
        setIsSaving(false);
        return;
      }

      console.log('[SGPA SAVE] ✅ Success! New CGPA:', updatedRows[0].cgpa);

      // 6. Dispatch sync event after confirmed write
      await new Promise(resolve => setTimeout(resolve, 300));
      window.dispatchEvent(new Event('cgpa-updated'));

      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('[SGPA SAVE] Unexpected error:', err);
      alert('Unexpected error: ' + err.message);
      setIsSaving(false);
    }
  };

  // Escape key closes modal
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
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
            className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-[0_0_40px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-2xl flex items-center gap-3 font-sans text-foreground">
                <Calendar className="h-7 w-7 text-primary" />
                Semester-wise SGPA
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-secondary/20 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 flex flex-col gap-5 font-sans overflow-y-auto">
              
              {/* Live CGPA Preview */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Calculated CGPA</span>
                <div className="text-4xl font-black text-primary font-mono mt-1">{getLiveCgpa()}</div>
              </div>

              {/* All 8 Semester Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sgpas.map((val, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/5 p-3 rounded-xl border border-primary/10 shadow-sm">
                    <span className="font-bold text-foreground text-sm">Sem {index + 1}</span>
                    <input 
                      type="number" 
                      min="0" max="10" step="0.01" 
                      value={val}
                      placeholder="0.00"
                      onChange={(e) => handleChange(index, e.target.value)}
                      className="w-20 p-2 font-mono font-bold text-base text-primary text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/40" 
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Leave semesters blank if not completed yet. CGPA = average of filled semesters.
              </p>

              {/* Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-border/50">
                <button 
                  onClick={saveSgpas}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? 'Saving...' : 'Save SGPA'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
