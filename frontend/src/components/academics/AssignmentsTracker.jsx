import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, CheckCircle2, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { format, isPast, parseISO } from 'date-fns';

export default function AssignmentsTracker() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });
    
    if (!error && data) {
      setAssignments(data);
    }
    setLoading(false);
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCourse.trim() || !user) return;

    const newAssignment = {
      user_id: user.id,
      title: newTitle,
      course_name: newCourse,
      due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('assignments')
      .insert([newAssignment])
      .select()
      .single();

    if (!error && data) {
      setAssignments(prev => [...prev, data]);
      setNewTitle('');
      setNewCourse('');
      setNewDueDate('');
      setShowAddForm(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'submitted' : 'pending';
    const { error } = await supabase
      .from('assignments')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="bg-card border-[3px] border-primary rounded-[2rem] shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary p-6 w-full mt-5">
      <div className="flex items-center justify-between mb-6 pb-4 border-b-[3px] border-primary/10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <ClipboardList size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none">Assignments</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending & Submitted Tasks</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center justify-center w-10 h-10 rounded-xl border-[3px] border-primary transition-all duration-300 shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none ${
            showAddForm ? 'bg-destructive text-destructive-foreground border-destructive shadow-destructive' : 'bg-primary text-primary-foreground'
          }`}
        >
          <Plus size={20} strokeWidth={3} className={`transform transition-transform duration-300 ${showAddForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ height: 0, opacity: 0, mb: 0 }}
            animate={{ height: 'auto', opacity: 1, mb: 20 }}
            exit={{ height: 0, opacity: 0, mb: 0 }}
            className="overflow-hidden"
            onSubmit={handleAddAssignment}
          >
            <div className="bg-primary/5 border-[3px] border-primary/20 rounded-[1.5rem] p-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  type="text" required placeholder="Assignment Title"
                  value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-2.5 font-bold text-sm focus:border-primary outline-none"
                />
                <input 
                  type="text" required placeholder="Course Name (e.g. CS101)"
                  value={newCourse} onChange={e => setNewCourse(e.target.value)}
                  className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-2.5 font-bold text-sm focus:border-primary outline-none"
                />
              </div>
              <div className="flex gap-3">
                <input 
                  type="date"
                  value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                  className="flex-1 bg-background border-2 border-primary/30 rounded-xl px-4 py-2.5 font-bold text-sm focus:border-primary outline-none cursor-pointer"
                />
                <button type="submit" className="bg-primary text-primary-foreground font-black tracking-widest uppercase text-xs px-6 py-2.5 rounded-xl shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:-translate-y-0.5 transition-all">
                  Save
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-6 text-primary/50 font-bold animate-pulse">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 text-primary/40 flex flex-col items-center">
            <FileText size={48} strokeWidth={1} className="mb-2" />
            <p className="font-bold">No assignments found.</p>
            <p className="text-xs uppercase tracking-widest mt-1">Enjoy your free time!</p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const isDone = assignment.status === 'submitted';
            const isLate = !isDone && assignment.due_date && isPast(parseISO(assignment.due_date));
            
            return (
              <motion.div 
                key={assignment.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border-[3px] transition-all duration-300 ${
                  isDone ? 'bg-secondary/10 border-secondary/30' : 
                  isLate ? 'bg-destructive/10 border-destructive/50' : 'bg-background border-primary/20 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3.5 mb-3 sm:mb-0 w-full sm:w-auto">
                  <button 
                    onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                    className={`mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all ${
                      isDone ? 'bg-secondary border-secondary text-white' : 'border-primary/40 hover:border-primary hover:bg-primary/10 text-transparent'
                    }`}
                  >
                    <CheckCircle2 size={16} strokeWidth={3} className={isDone ? 'opacity-100' : 'opacity-0'} />
                  </button>
                  <div className="flex flex-col">
                    <h4 className={`font-black text-sm sm:text-base leading-tight ${isDone ? 'line-through opacity-70' : ''}`}>
                      {assignment.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-primary/20">
                        {assignment.course_name}
                      </span>
                      {assignment.due_date && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                          isDone ? 'bg-background text-muted-foreground border-border' : 
                          isLate ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-background text-primary/60 border-primary/20'
                        }`}>
                          <Calendar size={10} strokeWidth={2.5}/> 
                          {format(parseISO(assignment.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(assignment.id)}
                  className="shrink-0 p-2 rounded-lg text-primary/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 sm:self-center self-end -mt-8 sm:mt-0"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
