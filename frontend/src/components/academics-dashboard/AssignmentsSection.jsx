import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, Clock, CheckCircle2, ArrowDown, ArrowUp, Minus, ListTodo, Trash2, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const PriorityIcon = ({ priority }) => {
  switch(priority) {
    case 'High': return <ArrowUp className="h-4 w-4 text-red-500" />;
    case 'Medium': return <ArrowDown className="h-4 w-4 text-yellow-500" />;
    case 'Low': return <Minus className="h-4 w-4 text-green-500" />;
    default: return null;
  }
};

const StatusIcon = ({ status }) => {
  return status === 'Completed' ? (
    <span className="flex items-center gap-1.5 text-green-500"><CheckCircle2 className="h-4 w-4" /> {status}</span>
  ) : (
    <span className="flex items-center gap-1.5 text-orange-500"><Clock className="h-4 w-4" /> {status}</span>
  );
};

export default function AssignmentsSection() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageMode, setIsManageMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStatus, setNewStatus] = useState('Pending');

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAssignments(data);
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    
    // Update locally immediately for optimistic UI
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));

    // Sync to backend
    await supabase
      .from('assignments')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('user_id', user.id);
  };

  const handleDelete = async (id) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const suffix = (d) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
    };
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day}${suffix(day)} ${months[date.getMonth()]}`;
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !newDueDate || !user) return;
    
    const formattedDate = formatDate(newDueDate);
    
    const newAssignment = {
      user_id: user.id,
      task: newTask,
      priority: newPriority,
      due_date: formattedDate,
      status: newStatus
    };
    
    const { data, error } = await supabase
      .from('assignments')
      .insert([newAssignment])
      .select()
      .single();

    if (!error && data) {
      setAssignments([data, ...assignments]);
    }
    
    setIsAddModalOpen(false);
    setNewTask('');
    setNewDueDate('');
    setNewPriority('Medium');
    setNewStatus('Pending');
  };

  return (
    <motion.div variants={sectionVariants} className="bg-card text-card-foreground p-8 rounded-2xl border border-border shadow-sm flex flex-col gap-8 min-h-[600px] font-jetbrains">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold flex items-center gap-4 font-jetbrains">
          <ListTodo className="h-10 w-10 text-primary" />
          Assignments
        </h2>
        <div className="flex gap-4 font-jetbrains">
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-transparent hover:border-primary/30 text-primary font-bold rounded-xl text-lg transition-all focus:ring-2 focus:ring-primary/20">
            <Plus className="h-6 w-6" /> Add New Assignment
          </button>
          <button onClick={() => setIsManageMode(!isManageMode)} className={`flex items-center gap-2 px-6 py-3 border font-bold rounded-xl text-lg transition-all focus:ring-2 focus:ring-border/50 ${isManageMode ? 'bg-secondary text-secondary-foreground border-secondary hover:brightness-110' : 'bg-transparent border-border hover:bg-secondary hover:text-secondary-foreground text-foreground hover:border-secondary'}`}>
            <Settings className="h-6 w-6" /> {isManageMode ? 'Done Managing' : 'Remove / Manage'}
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-muted-foreground border-b-2 border-border/50 text-xl font-bold uppercase tracking-widest pb-4">
              <th className="pb-4 pl-3 font-bold text-xl uppercase tracking-widest">Task</th>
              <th className="pb-4 font-bold text-xl uppercase tracking-widest">Priority</th>
              <th className="pb-4 font-bold text-xl uppercase tracking-widest">Due Date</th>
              <th className="pb-4 font-bold text-xl uppercase tracking-widest">Status</th>
              {isManageMode && <th className="pb-4 font-bold text-xl uppercase tracking-widest text-right pr-3 text-destructive">Action</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr>
                 <td colSpan="5" className="py-12 text-center text-muted-foreground font-bold">
                   <div className="flex justify-center items-center gap-3">
                     <Loader2 className="animate-spin h-6 w-6" /> Reaching database...
                   </div>
                 </td>
               </tr>
            ) : assignments.length === 0 ? (
               <tr>
                 <td colSpan="5" className="py-12 text-center text-muted-foreground font-bold text-xl lg:text-3xl opacity-50">
                    No active assignments tracking.
                 </td>
               </tr>
            ) : (
            <AnimatePresence>
            {assignments.map((item) => (
              <motion.tr
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                className="group border-b border-border/20 last:border-0 hover:bg-primary/5 transition-colors"
              >
                <td className="py-8 pl-3 font-medium flex items-center gap-4">
                  <input
                    type="checkbox"
                    className="h-6 w-6 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                    checked={item.status === 'Completed'}
                    onChange={() => handleToggleStatus(item.id, item.status)}
                  />
                  <span className={`text-xl ${item.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{item.task}</span>
                </td>
                <td className="py-8">
                  <div className="flex items-center gap-3 text-xl font-medium">
                    <PriorityIcon priority={item.priority} />
                    {item.priority}
                  </div>
                </td>
                <td className="py-8 text-xl font-medium text-muted-foreground">{item.due_date}</td>
                <td className="py-8 text-xl font-medium flex items-center gap-2">
                  <StatusIcon status={item.status} />
                </td>
                {isManageMode && (
                  <td className="py-4 text-right pr-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Delete assignment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </motion.tr>
            ))}
            </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden font-jetbrains"
            >
              <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
                <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                  <Plus className="h-5 w-5 text-primary" />
                  Add New Assignment
                </h3>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-secondary/20 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddAssignment} className="p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-muted-foreground">Task Name</label>
                  <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} required placeholder="e.g. AI Final Project Report" className="p-2.5 rounded-xl border border-border/50 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-muted-foreground">Priority</label>
                    <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="p-2.5 rounded-xl border border-border/50 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-muted-foreground">Due Date</label>
                    <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} required className="p-2.5 rounded-xl border border-border/50 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-muted-foreground">Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="p-2.5 rounded-xl border border-border/50 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm">Save Assignment</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
