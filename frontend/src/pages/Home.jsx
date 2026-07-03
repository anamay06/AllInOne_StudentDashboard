import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, TrendingUp, TrendingDown, X, Plus, History, Pencil, Trash2, Flame, Power, Check, Info, Calendar, RefreshCw, ExternalLink, AlertCircle, Trophy, Code, BarChart4, Pizza, Timer, ChevronRight, Bell, Sparkles, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

// Wrapping Card with Framer Motion for brutalist click animations
const MotionCard = motion(Card);

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  /* =========================================================================
     BACKEND INTEGRATION POINTS
  ========================================================================= */

  // Mock State for CGPA
  const [cgpaData, setCgpaData] = useState({ value: 0, trend: 'up' }); 
  // Removed custom arbitrary CGPA overriding to enforce strict SGPA mathematical average.
  
  // Base State for Budget (Only Total limit is mutable Base State)
  const [budgetData, setBudgetData] = useState({ total: 1000 });

  // Mock State for Habit Tracker
  const [habits, setHabits] = useState([]);
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);
  const [isContestsOpen, setIsContestsOpen] = useState(false);
  const [isContestsLoading, setIsContestsLoading] = useState(false);
  const [contests, setContests] = useState([]);
  
  // Alert Bar State
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isAlertPaused, setIsAlertPaused] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [editingHabitId, setEditingHabitId] = useState(null);

  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('low');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [isPriorityInfoOpen, setIsPriorityInfoOpen] = useState(false);
  const [isAddTodoOpen, setIsAddTodoOpen] = useState(false);

  // Google Calendar State
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isCalendarSynced, setIsCalendarSynced] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarAccessToken, setCalendarAccessToken] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarSources, setCalendarSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [isCalendarSettingsOpen, setIsCalendarSettingsOpen] = useState(false);

  // Layout Customization & Local Calendar Event States
  const [visibleWidgets, setVisibleWidgets] = useState(['cgpa', 'budget', 'habits', 'calendar', 'contests', 'todos']);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [localEvents, setLocalEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventTime, setNewEventTime] = useState('12:00');

  // State for Transactions & Modals
  const [transactions, setTransactions] = useState([]);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  
  // State for Editing
  const [editingTx, setEditingTx] = useState(null);

  // Form State for Mock Submission
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxTitle, setNewTxTitle] = useState('');

  // --------------------------------------------------------------------------
  // SENIOR DEV ARCHITECTURE: DERIVED STATE
  // To guarantee mathematical flawlessness, "Spent" is dynamically derived
  // entirely from the true history array. It cannot desync. 
  // --------------------------------------------------------------------------
  const calculatedSpent = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // Dynamic data-driven alerts based on user's actual data
  const alerts = React.useMemo(() => {
    const insights = [];
    let id = 1;

    // 1. CGPA Insight
    if (cgpaData.value > 0) {
      if (cgpaData.trend === 'up') {
        insights.push({ id: id++, type: 'academic', message: `Your CGPA is ${Number(cgpaData.value).toFixed(2)} and trending upward. Keep pushing!`, icon: <TrendingUp size={24} className="text-secondary" />, color: 'text-secondary' });
      } else if (cgpaData.trend === 'down') {
        insights.push({ id: id++, type: 'academic', message: `CGPA at ${Number(cgpaData.value).toFixed(2)} — focus on improving next semester.`, icon: <TrendingDown size={24} className="text-secondary" />, color: 'text-secondary' });
      } else {
        insights.push({ id: id++, type: 'academic', message: `CGPA holding steady at ${Number(cgpaData.value).toFixed(2)}. Aim higher!`, icon: <BarChart4 size={24} className="text-secondary" />, color: 'text-secondary' });
      }
    }

    // 2. Habit Streaks
    const activeHabits = habits.filter(h => h.isActive);
    const topStreak = activeHabits.reduce((best, h) => h.streak > best.streak ? h : best, { streak: 0, text: '' });
    if (topStreak.streak >= 3) {
      insights.push({ id: id++, type: 'habit', message: `"${topStreak.text}" streak is on fire — ${topStreak.streak} days!`, icon: <Flame size={24} className="text-secondary" />, color: 'text-secondary' });
    } else if (activeHabits.length > 0) {
      const undone = activeHabits.filter(h => !h.done).length;
      if (undone > 0) {
        insights.push({ id: id++, type: 'habit', message: `${undone} habit${undone > 1 ? 's' : ''} still pending today. Don't break the chain!`, icon: <Flame size={24} className="text-secondary" />, color: 'text-secondary' });
      } else {
        insights.push({ id: id++, type: 'habit', message: `All habits done for today. You're unstoppable!`, icon: <Check size={24} className="text-secondary" />, color: 'text-secondary' });
      }
    }

    // 3. Todo Progress
    if (todos.length > 0) {
      const pending = todos.filter(t => !t.done);
      const highPriority = pending.filter(t => t.priority === 'high');
      if (highPriority.length > 0) {
        insights.push({ id: id++, type: 'task', message: `${highPriority.length} high-priority task${highPriority.length > 1 ? 's' : ''} need your attention.`, icon: <AlertCircle size={24} className="text-secondary" />, color: 'text-secondary' });
      } else if (pending.length === 0) {
        insights.push({ id: id++, type: 'task', message: `All ${todos.length} tasks completed. Inbox zero!`, icon: <Check size={24} className="text-secondary" />, color: 'text-secondary' });
      } else {
        insights.push({ id: id++, type: 'task', message: `${pending.length} of ${todos.length} tasks remaining. Stay focused!`, icon: <Timer size={24} className="text-secondary" />, color: 'text-secondary' });
      }
    }

    // 4. Budget Insight
    if (budgetData.total > 0 && transactions.length > 0) {
      const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const pct = Math.round((totalSpent / budgetData.total) * 100);
      if (pct >= 90) {
        insights.push({ id: id++, type: 'budget', message: `Budget ${pct}% used — tighten spending to stay on track.`, icon: <AlertCircle size={24} className="text-secondary" />, color: 'text-secondary' });
      } else if (pct >= 50) {
        insights.push({ id: id++, type: 'budget', message: `₹${totalSpent.toLocaleString()} of ₹${budgetData.total.toLocaleString()} budget spent (${pct}%).`, icon: <Pizza size={24} className="text-secondary" />, color: 'text-secondary' });
      }
    }

    // Fallback
    if (insights.length === 0) {
      insights.push({ id: 1, type: 'welcome', message: 'Welcome! Add habits, tasks, and projects to see insights here.', icon: <Sparkles size={24} className="text-secondary" />, color: 'text-secondary' });
    }

    return insights;
  }, [cgpaData, habits, todos, budgetData, transactions]);

  // Fetch live Dashboard State from Supabase Data Sources
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // 1. Fetch User Settings
      let { data: settingsArr } = await supabase.from('user_settings').select('*').eq('user_id', user.id).limit(1);
      let settings = settingsArr && settingsArr.length > 0 ? settingsArr[0] : null;
      if (!settings) {
        const { data: newSettings } = await supabase.from('user_settings').insert({ user_id: user.id, cgpa: 0.00, cgpa_trend: 'neutral', budget_limit: 1000 }).select().limit(1);
        settings = newSettings && newSettings.length > 0 ? newSettings[0] : null;
      }

      if (settings) {
        setCgpaData({ value: Number(settings.cgpa) || 0, trend: settings.cgpa_trend || 'neutral' });
        setBudgetData({ total: settings.budget_limit });
        if (settings.visible_widgets) {
          setVisibleWidgets(settings.visible_widgets);
        }
      }

      // 2. Fetch Habits
      const { data: habitsData } = await supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (habitsData) setHabits(habitsData.map(h => ({ id: h.id, text: h.title, done: h.is_done, streak: h.streak, isActive: h.is_active })));

      // 3. Fetch Todos
      const { data: todosData } = await supabase.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (todosData) setTodos(todosData.map(t => ({ id: t.id, text: t.title, done: t.is_done, priority: t.priority })));

      // 4. Fetch Transactions
      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (txData) setTransactions(txData.map(t => ({ id: t.id, title: t.title, amount: Number(t.amount), date: t.date })));

      // 5. Fetch Local Calendar Events & Preset Sources
      const { data: localData } = await supabase.from('calendar_events').select('*').eq('user_id', user.id).order('start_time', { ascending: true });
      if (localData) setLocalEvents(localData);

      setCalendarSources([{ id: 'local', title: 'Local Events', type: 'calendar', color: '#10b981' }]);
      setSelectedSources(new Set(['local']));
    };

    fetchData();

    // Setup listener specifically for CGPA changes pushed from Academics page
    const fetchCgpaOnly = async () => {
      if (!user) return;
      await new Promise(resolve => setTimeout(resolve, 200));
      const { data } = await supabase.from('user_settings').select('cgpa, cgpa_trend').eq('user_id', user.id).limit(1);
      if (data && data.length > 0) setCgpaData({ value: Number(data[0].cgpa) || 0, trend: data[0].cgpa_trend || 'neutral' });
    };

    window.addEventListener('cgpa-updated', fetchCgpaOnly);
    return () => window.removeEventListener('cgpa-updated', fetchCgpaOnly);
  }, [user]);

  // Alert Carousel Logic
  useEffect(() => {
    if (isAlertPaused) return;
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAlertPaused, alerts.length]);

  // Reset carousel index when alerts change
  useEffect(() => {
    setCurrentAlertIndex(0);
  }, [alerts.length]);

  /* =========================================================================
     HABIT TRACKER HANDLERS
  ========================================================================= */
  const handleToggleHabitDoneMain = async (e, id) => {
    e.stopPropagation();
    const habit = habits.find(h => h.id === id);
    if (!habit || !user) return;
    const isNowDone = !habit.done;
    const newStreak = isNowDone ? (habit.streak || 0) + 1 : Math.max(0, (habit.streak || 0) - 1);
    
    setHabits(habits.map(h => h.id === id ? { ...h, done: isNowDone, streak: newStreak } : h));
    await supabase.from('habits').update({ is_done: isNowDone, streak: newStreak }).eq('id', id).eq('user_id', user.id);
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim() || !user) return;
    
    const { data } = await supabase.from('habits').insert([
      { user_id: user.id, title: newHabitTitle, is_done: false, streak: 0, is_active: true }
    ]).select();
    
    if (data && data[0]) {
      const h = data[0];
      setHabits([{ id: h.id, text: h.title, done: h.is_done, streak: h.streak, isActive: h.is_active }, ...habits]);
      setNewHabitTitle('');
    }
  };

  const handleToggleHabitActive = async (id) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || !user) return;
    const newActiveState = habit.isActive === false ? true : false;
    
    setHabits(habits.map(h => h.id === id ? { ...h, isActive: newActiveState } : h));
    await supabase.from('habits').update({ is_active: newActiveState }).eq('id', id).eq('user_id', user.id);
  };

  const handleDeleteHabit = async (id) => {
    if (!user) return;
    setHabits(habits.filter(h => h.id !== id));
    await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
  };

  const handleEditHabitToggle = async (habit) => {
    if (!user) return;
    if (editingHabitId === habit.id) {
       setEditingHabitId(null);
       await supabase.from('habits').update({ title: habit.text }).eq('id', habit.id).eq('user_id', user.id);
    } else {
       setEditingHabitId(habit.id);
    }
  };

  const handleEditHabitTextChange = (id, newText) => {
    setHabits(habits.map(h => h.id === id ? { ...h, text: newText } : h));
  };

  /* =========================================================================
     INTERACTION HANDLERS
  ========================================================================= */
  
  // ToDo Handlers
  const handleToggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo || !user) return;
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
    await supabase.from('todos').update({ is_done: !todo.done }).eq('id', id).eq('user_id', user.id);
  };
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !user) return;
    const { data } = await supabase.from('todos').insert([
      { user_id: user.id, title: newTodoTitle, is_done: false, priority: newTodoPriority }
    ]).select();
    if (data && data[0]) {
      const t = data[0];
      setTodos([{ id: t.id, text: t.title, done: t.is_done, priority: t.priority }, ...todos]);
      setNewTodoTitle('');
      setNewTodoPriority('low');
      setIsAddTodoOpen(false);
    }
  };
  const handleDeleteTodo = async (e, id) => {
    e.stopPropagation();
    if (!user) return;
    setTodos(todos.filter(t => t.id !== id));
    await supabase.from('todos').delete().eq('id', id).eq('user_id', user.id);
  };
  const handleEditTodoToggle = async (e, id) => {
    e.stopPropagation();
    if (!user) return;
    if (editingTodoId === id) {
       setEditingTodoId(null);
       const todo = todos.find(t => t.id === id);
       if (todo) await supabase.from('todos').update({ title: todo.text, priority: todo.priority }).eq('id', id).eq('user_id', user.id);
    } else {
       setEditingTodoId(id);
    }
  };
  const handleEditTodoTextChange = (id, newText) => {
    setTodos(todos.map(t => t.id === id ? { ...t, text: newText } : t));
  };
  const handleEditTodoPriorityChange = async (id, newPriority) => {
    if (!user) return;
    setTodos(todos.map(t => t.id === id ? { ...t, priority: newPriority } : t));
    await supabase.from('todos').update({ priority: newPriority }).eq('id', id).eq('user_id', user.id);
  };

  /* =========================================================================
     GOOGLE CALENDAR HANDLERS
  ========================================================================= */
  const fetchCalendarEvents = async (accessToken) => {
    setIsCalendarLoading(true);
    try {
      const rangeStart = startOfMonth(subMonths(new Date(), 1)).toISOString();
      const rangeEnd = endOfMonth(addMonths(new Date(), 3)).toISOString();
      const headers = { Authorization: `Bearer ${accessToken}` };

      // Helper for pagination
      const fetchPaginated = async (url) => {
        let allItems = [];
        let pageToken = null;
        do {
          const separator = url.includes('?') ? '&' : '?';
          const paginatedUrl = pageToken ? `${url}${separator}pageToken=${pageToken}` : url;
          const res = await fetch(paginatedUrl, { headers });
          const data = await res.json();
          if (data.items) allItems = [...allItems, ...data.items];
          pageToken = data.nextPageToken;
        } while (pageToken);
        return allItems;
      };

      // 1. Fetch ALL Calendars
      const calendars = await fetchPaginated('https://www.googleapis.com/calendar/v3/users/me/calendarList');
      const calList = calendars.length > 0 ? calendars : [{ id: 'primary' }];

      // 2. Fetch Events from each calendar
      const eventPromises = calList.map(cal => 
        fetchPaginated(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${rangeStart}&timeMax=${rangeEnd}&singleEvents=true&orderBy=startTime`)
          .then(events => events.map(e => ({ ...e, _sourceId: cal.id })))
          .catch(() => [])
      );

      // 3. Fetch ALL Task Lists
      const taskLists = await fetchPaginated('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
      
      // 4. Fetch Tasks from each task list
      const taskPromises = taskLists.map(list => 
        fetchPaginated(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=true`)
          .then(tasks => tasks.map(task => ({
            id: task.id,
            summary: task.title,
            description: task.notes,
            start: { dateTime: task.due || task.updated }, // Tasks only have due date
            isTask: true,
            status: task.status,
            _sourceId: list.id
          })))
          .catch(() => [])
      );

      const [allEventArrays, allTaskArrays] = await Promise.all([
        Promise.all(eventPromises),
        Promise.all(taskPromises)
      ]);

      // NEW: Set Sources and default selected sources
      const fetchedSources = [
         { id: 'local', title: 'Local Events', type: 'calendar', color: '#10b981' },
         ...calList.map(c => ({ id: c.id, title: c.summary || 'Calendar', type: 'calendar', color: c.backgroundColor || '#7c3aed' })),
         ...taskLists.map(t => ({ id: t.id, title: `Tasks: ${t.title}`, type: 'tasklist', color: '#4f46e5' }))
      ];
      setCalendarSources(fetchedSources);
      
      setSelectedSources(prev => {
        const newSet = new Set(prev);
        newSet.add('local');
        fetchedSources.forEach(s => {
          if (prev.size === 0 || (prev.size === 1 && prev.has('local'))) {
            newSet.add(s.id);
          }
        });
        return newSet;
      });

      // 5. Merge, filter by range, and DEDUPLICATE by ID
      const allItems = [...allEventArrays.flat(), ...allTaskArrays.flat()];
      const uniqueMap = new Map();
      
      allItems.forEach(item => {
        if (!item.id || !uniqueMap.has(item.id)) {
          uniqueMap.set(item.id || Math.random().toString(), item);
        }
      });

      const merged = Array.from(uniqueMap.values())
        .filter(item => {
          const itemTime = item.start?.dateTime || item.start?.date;
          return itemTime && itemTime >= rangeStart && itemTime <= rangeEnd;
        })
        .sort((a, b) => {
          const aTime = a.start?.dateTime || a.start?.date || '';
          const bTime = b.start?.dateTime || b.start?.date || '';
          return aTime.localeCompare(bTime);
        });

      setCalendarEvents(merged);
      setIsCalendarSynced(true);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setIsCalendarLoading(false);
    }
  };

  // Autonomous Background Calendar Sync
  useEffect(() => {
    const fetchLinkedCalendar = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_URL}/api/google/token?userId=${user.id}`);
        const data = await res.json();
        if (data.access_token) {
          setCalendarAccessToken(data.access_token);
          fetchCalendarEvents(data.access_token);
        }
      } catch (err) {
        console.error('Failed to auto-fetch Google Calendar token:', err);
      }
    };
    fetchLinkedCalendar();
  }, [user]);

  const handleRefreshCalendar = () => {
    if (calendarAccessToken) {
      fetchCalendarEvents(calendarAccessToken);
    }
  };

  // Handle Add Event (Google Calendar Sync support)
  const handleAddLocalEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !selectedDay || !user) return;

    const eventDate = new Date(selectedDay);
    const [hours, minutes] = newEventTime.split(':');
    eventDate.setHours(parseInt(hours) || 12, parseInt(minutes) || 0, 0, 0);
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // Default to 1 hour duration

    if (calendarAccessToken) {
      // 1. Google Calendar is synced: add to Google directly!
      try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${calendarAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: newEventTitle,
            description: newEventDescription || '',
            start: { dateTime: eventDate.toISOString() },
            end: { dateTime: endDate.toISOString() }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }

        // Successfully added to Google Calendar! Refetch events.
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventTime('12:00');
        fetchCalendarEvents(calendarAccessToken);
        return;
      } catch (err) {
        console.error('[Calendar] Failed to add event to Google Calendar:', err);
        alert(`Failed to add event to Google Calendar: ${err.message}. Falling back to local storage.`);
      }
    }

    // 2. Fallback / Local Storage in Supabase
    const { data, error } = await supabase.from('calendar_events').insert([
      {
        user_id: user.id,
        title: newEventTitle,
        description: newEventDescription || null,
        start_time: eventDate.toISOString()
      }
    ]).select();

    if (error) {
      console.error('[Calendar] Failed to add local event:', error);
      alert('Failed to save event locally.');
      return;
    }

    if (data && data[0]) {
      setLocalEvents([...localEvents, data[0]]);
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventTime('12:00');
    }
  };

  // Handle Delete Event (Google Calendar & Local Event support)
  const handleDeleteEvent = async (event) => {
    if (!user) return;

    if (event.isLocal) {
      // 1. Delete local event from Supabase
      const { error } = await supabase.from('calendar_events').delete().eq('id', event.id).eq('user_id', user.id);
      if (error) {
        console.error('[Calendar] Failed to delete local event:', error);
        return;
      }
      setLocalEvents(localEvents.filter(e => e.id !== event.id));
    } else {
      // 2. Delete Google Event/Task
      if (!calendarAccessToken) {
        alert('Google Calendar connection missing.');
        return;
      }

      if (event.isTask) {
        try {
          const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${event._sourceId}/tasks/${event.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${calendarAccessToken}` }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          fetchCalendarEvents(calendarAccessToken);
        } catch (err) {
          console.error('[Calendar] Failed to delete Google Task:', err);
          alert('Failed to delete Google Task.');
        }
      } else {
        try {
          const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${event._sourceId}/events/${event.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${calendarAccessToken}` }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          fetchCalendarEvents(calendarAccessToken);
        } catch (err) {
          console.error('[Calendar] Failed to delete Google Event:', err);
          alert('Failed to delete Google Calendar event (read-only primary/secondary checks).');
        }
      }
    }
  };

  const loadContests = async () => {
    setIsContestsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contests`);
      const data = await res.json();
      setContests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Contest Load Error:", err);
      setContests([]);
    } finally {
      setIsContestsLoading(false);
    }
  };

  const handleOpenContests = () => {
    setIsContestsOpen(true);
    loadContests();
  };

  const formatEventTime = (event) => {
    try {
      if (event.isTask) {
        return event.status === 'completed' ? 'Completed Task' : 'Google Task';
      }
      if (event.start?.dateTime) {
        const date = parseISO(event.start.dateTime);
        const dayLabel = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEE, MMM d');
        return `${dayLabel} · ${format(date, 'h:mm a')}`;
      }
      if (event.start?.date) {
        const date = parseISO(event.start.date);
        if (isToday(date)) return 'Today · All day';
        if (isTomorrow(date)) return 'Tomorrow · All day';
        return `${format(date, 'EEE, MMM d')} · All day`;
      }
      return 'No time set';
    } catch { return 'Upcoming'; }
  };

  // Calendar Grid Helpers
  const getEventsForDay = (day) => {
    // 1. Google events
    const google = calendarEvents.filter(event => {
      if (!selectedSources.has(event._sourceId)) return false;
      try {
        const eventDate = event.start?.dateTime ? parseISO(event.start.dateTime) : event.start?.date ? parseISO(event.start.date) : null;
        return eventDate && isSameDay(eventDate, day);
      } catch { return false; }
    });

    // 2. Local events
    const local = [];
    if (selectedSources.has('local')) {
      localEvents.forEach(e => {
        try {
          const eventDate = parseISO(e.start_time);
          if (eventDate && isSameDay(eventDate, day)) {
            local.push({
              id: e.id,
              summary: e.title,
              description: e.description,
              start: { dateTime: e.start_time },
              isLocal: true,
              _sourceId: 'local'
            });
          }
        } catch {}
      });
    }

    return [...google, ...local];
  };

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  // Handle Add Transaction Submit
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newTxAmount);
    if (!newTxTitle || isNaN(parsedAmount) || !user) return;
    
    const { data } = await supabase.from('transactions').insert([
      { user_id: user.id, title: newTxTitle, amount: parsedAmount, date: 'Just now' }
    ]).select();
    
    if (data && data[0]) {
      const newTx = {
        id: data[0].id,
        title: data[0].title,
        amount: Number(data[0].amount),
        date: data[0].date
      };
      setTransactions([newTx, ...transactions]);
      setNewTxAmount('');
      setNewTxTitle('');
      setIsAddTransactionOpen(false);
    }
  };

  // Handle Setting New Budget Limit
  const handleSetBudget = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(newBudgetAmount);
    if (!isNaN(parsed) && parsed > 0 && user) {
      setBudgetData({ total: parsed });
      await supabase.from('user_settings').update({ budget_limit: parsed }).eq('user_id', user.id);
      setIsBudgetOpen(false);
      setNewBudgetAmount('');
    }
  };

  // Open Edit Modal safely
  const openEditModal = (tx) => {
    setEditingTx(tx);
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (id) => {
    if (!user) return;
    setTransactions(transactions.filter(t => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
  };

  // Handle Edit Transaction Submission
  const handleEditTransaction = async (e) => {
    e.preventDefault();
    if (!editingTx || !editingTx.title || !user) return;
    
    const parsedAmount = parseFloat(editingTx.amount);
    if (isNaN(parsedAmount)) return;

    setTransactions(transactions.map(t => t.id === editingTx.id ? { ...editingTx, amount: parsedAmount } : t));
    await supabase.from('transactions').update({ title: editingTx.title, amount: parsedAmount }).eq('id', editingTx.id).eq('user_id', user.id);
    setEditingTx(null);
  };

  // Reusable Neo-Brutalist Animation Variants
  const interactiveCardVariants = {
    hover: { 
      translateY: 4, 
      translateX: 4, 
      boxShadow: "0px 0px 0px var(--tw-shadow-color)", 
      transition: { duration: 0.15 }
    },
    tap: {
      scale: 0.98,
      translateY: 6, 
      translateX: 6,
      boxShadow: "0px 0px 0px var(--tw-shadow-color)",
    }
  };

  return (
    <>
      {/* Header bar with custom layout toggler */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 shrink-0 border-[3px] border-primary p-6 rounded-[2rem] bg-card shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-primary uppercase tracking-tight italic">AIM Dashboard</h2>
          <p className="text-sm sm:text-base font-bold text-primary/70 tracking-wider">
            Made by: <span className="text-primary font-black text-base sm:text-lg">Anamay Shukla</span> (anamay.shukla06@gmail.com)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a 
            href="https://digitalheroesco.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center bg-secondary text-primary-foreground border-[3px] border-primary hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary font-black uppercase tracking-widest text-xs sm:text-sm py-3 px-5 rounded-xl h-auto"
          >
            Built for Digital Heroes
          </a>
          <Button 
            onClick={() => setIsCustomizeModalOpen(true)}
            className="bg-card border-[3px] border-primary text-primary hover:bg-primary hover:text-primary-foreground font-black uppercase tracking-widest text-xs sm:text-sm py-3 px-5 rounded-xl shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:translate-y-0.5 hover:shadow-none transition-all h-auto"
          >
            <Settings size={14} className="mr-2" strokeWidth={3} /> Customize Widgets
          </Button>
        </div>
      </div>

      <div className="w-full h-full flex flex-col xl:flex-row gap-6 pb-20 xl:pb-0 relative z-10">
        
        {/* Left & Center Wrapper */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Universal Alert Bar spanning Left & Center with Glowing Border */}
          <MotionCard 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onMouseEnter={() => setIsAlertPaused(true)}
            onMouseLeave={() => setIsAlertPaused(false)}
            className="w-full bg-card text-card-foreground rounded-[2.5rem] border-[4px] border-primary flex items-center justify-center relative overflow-hidden shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary/10 min-h-[120px] cursor-grab active:cursor-grabbing transition-shadow hover:shadow-primary/20"
          >
            {/* Dynamic background effect */}
            <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${
              alerts[currentAlertIndex].id % 2 === 0 ? 'bg-secondary' : 'bg-primary'
            }`}></div>
            
            <CardContent className="p-0 w-full h-full relative z-10 flex flex-col justify-center">
              <div className="relative w-full overflow-hidden">
                <motion.div 
                  className="flex cursor-grab active:cursor-grabbing"
                  animate={{ x: `-${currentAlertIndex * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = offset.x;
                    if (swipe < -50) {
                      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
                    } else if (swipe > 50) {
                      setCurrentAlertIndex((prev) => (prev - 1 + alerts.length) % alerts.length);
                    }
                  }}
                >
                  {alerts.map((alert, index) => (
                    <div 
                      key={alert.id}
                      className="min-w-full flex items-center justify-center px-8 xl:px-12 py-6 gap-6 select-none"
                    >
                      <div className="p-4 bg-primary/5 rounded-2xl border-[3px] border-primary/20 flex-shrink-0 shadow-sm">
                        {alert.icon}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 whitespace-nowrap">
                            {alert.type} SIGNAL
                          </span>
                          <div className="h-[2px] flex-1 bg-primary/5 rounded-full"></div>
                        </div>
                        <h2 className="text-xl xl:text-3xl font-black tracking-tight text-primary leading-tight truncate">
                          {alert.message}
                        </h2>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {alerts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentAlertIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === currentAlertIndex ? 'w-8 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </MotionCard>

          {/* Inner Flex for Left Column and Center Column */}
          <div className="flex flex-col xl:flex-row gap-6 flex-1">
            {/* Left Column: Tiny Widgets */}
            <div className="flex flex-col gap-6 xl:w-48 xl:w-64 shrink-0">
              
              {/* CGPA Widget */}
              {visibleWidgets.includes('cgpa') && (
                <MotionCard 
                  whileHover="hover"
                  variants={interactiveCardVariants}
                  className="bg-card rounded-[2rem] border-[3px] border-primary shrink-0 h-auto py-2 flex flex-col justify-center shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary text-primary relative overflow-hidden group"
                >
                  <CardContent className="p-4 flex flex-col items-center h-full w-full">
                    <span className="text-lg xl:text-xl font-black opacity-70 tracking-widest uppercase mt-2">CGPA</span>
                    <div className="flex-1 flex items-center justify-center gap-2 pb-1 w-full mt-1">
                      <span className="font-black text-5xl tracking-tighter leading-none">{cgpaData.value || '--'}</span>
                      {cgpaData.trend === 'up' ? <TrendingUp size={28} strokeWidth={4} className="text-secondary ml-1" /> : <TrendingDown size={28} strokeWidth={4} className="text-destructive ml-1" />}
                    </div>
                  </CardContent>
                </MotionCard>
              )}
              
              {/* Total Spent / Budget Widget */}
              {visibleWidgets.includes('budget') && (
                <MotionCard 
                  whileHover="hover"
                  variants={interactiveCardVariants}
                  className="bg-card rounded-[2rem] border-[3px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary font-bold text-primary flex flex-col cursor-crosshair h-auto shrink-0 relative"
                >
                  {/* Ultra-Micro Edit Budget Button */}
                  <button 
                    onClick={() => setIsBudgetOpen(true)}
                    className="absolute top-4 right-5 p-1.5 text-primary/20 hover:text-primary hover:bg-primary/5 rounded-full transition-colors z-20 cursor-pointer"
                    title="Update Budget Limit"
                  >
                    <Pencil size={14} strokeWidth={3.5} />
                  </button>
                  
                  <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                    
                    {/* Large Unified Donut Chart */}
                    <div className="relative w-36 h-36 flex items-center justify-center mb-6 mt-2 shrink-0">
                      <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
                        {/* Background Track */}
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary/10"
                        />
                        {/* Animated Fill Track (turns Red if over budget) */}
                        <motion.path
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: `${Math.min((calculatedSpent / (budgetData.total || 1)) * 100, 100).toFixed(1)}, 100` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" 
                          className={calculatedSpent > budgetData.total ? "text-destructive" : "text-secondary"}
                        />
                      </svg>
                      
                      {/* Inner Value perfectly contained */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 overflow-hidden px-2">
                         <span className="text-[9px] font-black opacity-40 uppercase tracking-widest leading-none mb-0.5">of limit ${budgetData.total}</span>
                         <span className={`text-3xl font-black tracking-tighter truncate w-full ${calculatedSpent > budgetData.total ? 'text-destructive' : 'text-secondary'}`}>
                           ${calculatedSpent}
                         </span>
                      </div>
                      
                      {/* Percentage Overhanging Badge */}
                      <div className={`absolute -bottom-3 px-3 py-1 bg-background border-[3px] border-primary rounded-full text-xs font-black shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary ${calculatedSpent > budgetData.total ? 'text-destructive' : 'text-primary'}`}>
                        {Math.round((calculatedSpent / (budgetData.total || 1)) * 100)}%
                      </div>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="w-full flex gap-3 mt-auto relative z-20">
                      <Button 
                        onClick={() => setIsAddTransactionOpen(true)}
                        className="flex-1 text-sm font-extrabold bg-secondary text-primary-foreground h-auto py-3 rounded-2xl border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all px-0"
                      >
                        <Plus size={18} strokeWidth={4} className="mr-1" /> Add
                      </Button>
                      <Button 
                        onClick={() => setIsHistoryOpen(true)}
                        variant="outline"
                        className="flex-1 text-sm font-extrabold bg-card text-primary h-auto py-3 rounded-2xl border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none hover:translate-y-1 hover:translate-x-1 hover:bg-muted/20 transition-all px-0"
                      >
                        <History size={16} strokeWidth={3} className="mr-1" /> History
                      </Button>
                    </div>
                  </CardContent>
                </MotionCard>
              )}

              {/* Habit Tracker Widget & Explore Button Combined */}
              {visibleWidgets.includes('habits') && (
                <MotionCard 
                  whileHover="hover"
                  variants={interactiveCardVariants}
                  className="flex-1 min-h-0 bg-card rounded-[2rem] border-[3px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary text-primary flex flex-col cursor-pointer"
                >
                  <CardContent className="p-6 flex flex-col items-start justify-start w-full flex-1">
                     <span className="font-extrabold text-xl tracking-tight mb-4 uppercase shrink-0">Habit Tracker</span>
                     <div className="w-full flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto overflow-x-hidden pr-2">
                       {habits.length > 0 ? habits.filter(h => h.isActive !== false).map(habit => (
                         <div key={habit.id} className="flex items-center justify-between gap-3 w-full group cursor-pointer" onClick={(e) => handleToggleHabitDoneMain(e, habit.id)}>
                           <div className="flex items-center gap-3 flex-1 min-w-0 py-1 pr-1">
                             <div className={`w-5 h-5 flex items-center justify-center rounded-md border-[3px] border-primary shrink-0 transition-colors shadow-sm ${habit.done ? 'bg-secondary' : 'bg-transparent group-hover:bg-primary/10'}`}>
                               {habit.done && <Check size={12} strokeWidth={4} className="text-primary" />}
                             </div>
                             <span className={`text-sm font-bold truncate transition-transform ${habit.done ? 'line-through opacity-40' : 'group-hover:translate-x-1'}`}>{habit.text}</span>
                           </div>
                           <div className="flex items-center gap-1 opacity-70 shrink-0">
                              <Flame size={14} className={habit.streak > 2 ? 'text-[#ff4500]' : 'text-primary'} fill={habit.streak > 2 ? '#ff4500' : 'none'} />
                              <span className="text-xs font-black">{habit.streak || 0}</span>
                           </div>
                         </div>
                       )) : [1,2,3].map(i => <div key={i} className="animate-pulse h-4 w-full bg-muted rounded-full"></div>)}
                     </div>
                  </CardContent>
                  
                  {/* Integrated Explore Button */}
                  <div className="w-full p-4 pt-0 mt-auto">
                    <Button onClick={() => setIsHabitsOpen(true)} className="w-full bg-primary text-primary-foreground rounded-[1.2rem] py-6 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-secondary cursor-pointer hover:bg-secondary hover:text-primary transition-all font-black text-center tracking-widest uppercase text-sm h-auto active:translate-y-1 active:translate-x-1 active:shadow-none hover:shadow-[0px_0px_0px_var(--tw-shadow-color)]">
                      Explore Habits
                    </Button>
                  </div>
                </MotionCard>
              )}
            </div>

            {/* Center Column: Calendar & Momentum */}
            <div className="flex flex-col gap-6 flex-1 min-w-0">
              {visibleWidgets.includes('calendar') && (
                <Card 
                  className="flex-1 bg-card rounded-[2rem] border-[3px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary flex flex-col min-h-[300px] overflow-hidden"
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-primary/10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-secondary">
                          <Calendar size={18} strokeWidth={3} className="text-primary-foreground" />
                        </div>
                        <h2 className="text-xl font-black text-primary tracking-tight uppercase">Calendar</h2>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setIsCalendarSettingsOpen(true)} className="p-2 text-primary/30 hover:text-primary transition-all cursor-pointer rounded-xl hover:bg-primary/10" title="Settings">
                          <Settings size={16} strokeWidth={3} />
                        </button>
                        {isCalendarSynced && (
                          <button onClick={handleRefreshCalendar} className="p-2 text-primary/30 hover:text-primary transition-all cursor-pointer rounded-xl hover:bg-primary/10" title="Refresh">
                            <RefreshCw size={16} strokeWidth={3} className={isCalendarLoading ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 px-6 pb-6 pt-4">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-6">
                        <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="w-10 h-10 flex items-center justify-center text-primary/60 hover:text-primary bg-background hover:bg-primary/10 rounded-2xl transition-all cursor-pointer border-[3px] border-primary/10 hover:border-primary shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/5 font-black text-xl leading-none active:translate-y-[2px] active:shadow-none">&lsaquo;</button>
                        <div className="text-center group cursor-default">
                          <span className="font-black text-2xl text-primary tracking-tight transition-colors group-hover:text-secondary">{format(calendarMonth, 'MMMM')}</span>
                          <span className="font-bold text-2xl text-primary/20 ml-2">{format(calendarMonth, 'yyyy')}</span>
                        </div>
                        <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="w-10 h-10 flex items-center justify-center text-primary/60 hover:text-primary bg-background hover:bg-primary/10 rounded-2xl transition-all cursor-pointer border-[3px] border-primary/10 hover:border-primary shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/5 font-black text-xl leading-none active:translate-y-[2px] active:shadow-none">&rsaquo;</button>
                      </div>

                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-3 mb-3">
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                          <div key={d} className="text-center text-[12px] font-black text-primary/20 uppercase tracking-[0.2em] py-1">{d}</div>
                        ))}
                      </div>

                      {/* Day Cells Grid */}
                      <div className="grid grid-cols-7 gap-3 flex-1">
                        {generateCalendarDays().map((day, idx) => {
                          const dayEvents = getEventsForDay(day);
                          const isCurrentMonth = isSameMonth(day, calendarMonth);
                          const isSelected = selectedDay && isSameDay(day, selectedDay);
                          const today = isToday(day);
                          const hasEvents = dayEvents.length > 0 && isCurrentMonth;
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedDay(isSelected ? null : day)}
                              className={`relative group flex flex-col items-center justify-center rounded-[1.2rem] min-h-[48px] transition-all cursor-pointer text-sm font-bold border-[2.5px]
                                ${!isCurrentMonth ? 'opacity-10 pointer-events-none' : 'hover:scale-[1.05] hover:z-10'}
                                ${today && !isSelected ? 'bg-secondary/10 border-secondary text-secondary font-black shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/10' : ''}
                                ${isSelected ? 'bg-primary border-primary text-primary-foreground font-black shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-secondary scale-[1.08] z-20' : ''}
                                ${isCurrentMonth && !today && !isSelected ? 'bg-background border-primary/5 text-primary hover:border-primary/40 hover:bg-primary/5' : ''}
                              `}
                            >
                              <span className={`leading-none ${isSelected ? 'text-primary-foreground' : ''}`}>{format(day, 'd')}</span>
                              
                              {hasEvents && (
                                <div className={`absolute -top-2 -right-2 min-w-[20px] h-[20px] p-1 flex items-center justify-center rounded-lg text-[10px] font-black leading-none border-[2px] shadow-sm transition-transform group-hover:scale-110
                                  ${isSelected ? 'bg-secondary text-primary border-primary' : today ? 'bg-primary text-primary-foreground border-secondary' : 'bg-secondary text-primary-foreground border-primary'}
                                `}>
                                  {dayEvents.length}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selected Day Event Modal - Full Screen */}
              <AnimatePresence>
                {selectedDay && (() => {
                  const dayEvents = getEventsForDay(selectedDay);
                  const dayLabel = isToday(selectedDay) ? 'Today' : isTomorrow(selectedDay) ? 'Tomorrow' : format(selectedDay, 'EEEE');
                  const dateLabel = format(selectedDay, 'MMMM d, yyyy');
                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                      onClick={() => setSelectedDay(null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card w-full max-w-2xl rounded-[2.5rem] border-[4px] border-primary shadow-[10px_10px_0px_var(--tw-shadow-color)] shadow-primary relative flex flex-col max-h-[85vh] overflow-hidden"
                      >
                        {/* Gradient Header Banner */}
                        <div className="bg-primary px-10 pt-10 pb-8 relative">
                          <button onClick={() => setSelectedDay(null)} className="absolute top-5 right-5 p-2.5 bg-primary-foreground/20 text-primary-foreground rounded-full hover:bg-primary-foreground/40 transition-colors cursor-pointer">
                            <X size={22} strokeWidth={3} />
                          </button>
                          <h2 className="text-4xl font-black text-primary-foreground uppercase tracking-tight">{dayLabel}</h2>
                          <p className="text-base font-bold text-primary-foreground/60 mt-2 tracking-wide">{dateLabel}</p>
                          <div className="mt-4 flex gap-2">
                            {dayEvents.some(e => !e.isTask) && (
                              <span className="text-[10px] font-black bg-secondary text-primary-foreground px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                                {dayEvents.filter(e => !e.isTask).length} {dayEvents.filter(e => !e.isTask).length === 1 ? 'Event' : 'Events'}
                              </span>
                            )}
                            {dayEvents.some(e => e.isTask) && (
                              <span className="text-[10px] font-black bg-background text-primary px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md border-[2px] border-primary">
                                {dayEvents.filter(e => e.isTask).length} {dayEvents.filter(e => e.isTask).length === 1 ? 'Task' : 'Tasks'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Events List */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-8 flex flex-col">
                          <div className="flex-1">
                            {dayEvents.length > 0 ? (
                              <div className="flex flex-col gap-5">
                                {dayEvents.map((event, idx) => {
                                  const startTime = event.start?.dateTime ? format(parseISO(event.start.dateTime), 'h:mm a') : 'All day';
                                  const endTime = event.end?.dateTime ? format(parseISO(event.end.dateTime), 'h:mm a') : '';
                                  const timeRange = endTime ? `${startTime} — ${endTime}` : startTime;
                                  
                                  return (
                                    <motion.div 
                                      key={event.id || idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.08 }}
                                      className="bg-background rounded-[1.5rem] p-6 border-[3px] border-primary/15 hover:border-primary transition-all shadow-none hover:shadow-[4px_4px_0px_var(--tw-shadow-color)] hover:shadow-primary"
                                    >
                                      <div className="flex items-start gap-5">
                                        {/* Time Pill */}
                                        <div className="shrink-0 bg-primary rounded-2xl px-4 py-3 text-center min-w-[90px] shadow-[3px_3px_0px_var(--tw-shadow-color)] shadow-secondary">
                                          <p className="text-lg font-black text-primary-foreground leading-tight">
                                            {event.start?.dateTime ? format(parseISO(event.start.dateTime), 'h:mm') : 'ALL'}
                                          </p>
                                          <p className="text-[11px] font-bold text-primary-foreground/60 uppercase">
                                            {event.start?.dateTime ? format(parseISO(event.start.dateTime), 'a') : 'DAY'}
                                          </p>
                                        </div>

                                        {/* Event Details */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                              {event.isTask && (
                                                <div className={`p-1 rounded-md border-[2px] ${event.status === 'completed' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-primary/10 border-primary text-primary'}`}>
                                                  <Check size={12} strokeWidth={4} />
                                                </div>
                                              )}
                                              <h4 className="font-extrabold text-primary text-xl leading-tight truncate">{event.summary || 'Untitled'}</h4>
                                            </div>
                                            {(event.isLocal || calendarAccessToken) && (
                                               <button 
                                                 onClick={() => handleDeleteEvent(event)} 
                                                 className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer border-[2px] border-transparent hover:border-destructive/20 shrink-0 ml-2"
                                                 title="Delete Event"
                                               >
                                                 <Trash2 size={16} strokeWidth={3} />
                                               </button>
                                            )}
                                          </div>
                                          <p className="text-sm font-bold text-primary/40 tracking-wide">
                                            {event.isTask ? (event.status === 'completed' ? '✅ Completed Task' : '📅 Due Today') : timeRange}
                                          </p>
                                          
                                          {event.location && (
                                            <p className="text-sm font-semibold text-primary/50 mt-3 truncate">📍 {event.location}</p>
                                          )}
                                          
                                          {event.description && (
                                            <p className="text-sm font-medium text-primary/35 mt-2 line-clamp-2 leading-relaxed">{event.description.replace(/<[^>]*>/g, '').slice(0, 150)}</p>
                                          )}
                                          
                                          {event.isTask && event.status !== 'completed' && (
                                            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-wider">
                                              <AlertCircle size={10} strokeWidth={3} /> Pending Task
                                            </div>
                                          )}

                                          {/* Action Links */}
                                          <div className="flex items-center gap-3 mt-4">
                                            {event.hangoutLink && (
                                              <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" className="text-sm font-black bg-secondary text-primary-foreground px-5 py-2 rounded-xl border-[3px] border-primary shadow-[3px_3px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase tracking-wider">
                                                Join Meet
                                              </a>
                                            )}
                                            {event.htmlLink && (
                                              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="text-sm font-black bg-card text-primary px-5 py-2 rounded-xl border-[3px] border-primary shadow-[3px_3px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase tracking-wider flex items-center gap-1.5">
                                                <ExternalLink size={13} strokeWidth={3} /> Open
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <Calendar size={48} strokeWidth={2} className="text-primary/15" />
                                <p className="font-black text-primary/25 uppercase tracking-widest text-base">No events scheduled</p>
                                <p className="text-sm text-primary/15 font-medium">This day is free — enjoy it!</p>
                              </div>
                            )}
                          </div>

                          {/* Add Custom Event Form */}
                          <form onSubmit={handleAddLocalEvent} className="mt-8 pt-6 border-t-[3px] border-primary/15 flex flex-col gap-4 shrink-0">
                            <h5 className="font-black text-primary text-sm uppercase tracking-wider">Add Local Event</h5>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input 
                                type="text" 
                                required 
                                value={newEventTitle} 
                                onChange={(e) => setNewEventTitle(e.target.value)} 
                                placeholder="Event Title..." 
                                className="flex-1 bg-background border-[3px] border-primary/20 focus:border-primary rounded-xl px-4 py-2 text-sm font-bold outline-none transition-all"
                              />
                              <input 
                                type="time" 
                                required 
                                value={newEventTime} 
                                onChange={(e) => setNewEventTime(e.target.value)} 
                                className="bg-background border-[3px] border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm font-bold outline-none transition-all"
                              />
                              <Button 
                                type="submit" 
                                className="bg-primary text-primary-foreground font-black px-6 py-2.5 rounded-xl border-[3px] border-primary shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-secondary hover:translate-y-0.5 hover:shadow-none transition-all h-auto text-xs uppercase"
                              >
                                Add Event
                              </Button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

            </div>
          </div>

        </div>

        {/* Right Column: Upcoming Contests & ToDo List */}
        <div className="flex flex-col gap-6 xl:w-64 xl:w-80 shrink-0">
          
          {visibleWidgets.includes('contests') && (
            <MotionCard 
              whileHover="hover"
              whileTap="tap"
              variants={interactiveCardVariants}
              onClick={handleOpenContests}
              className="bg-card rounded-[2rem] border-[3px] border-primary text-primary flex flex-col justify-center items-center shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary transition-all cursor-pointer min-h-[100px] shrink-0"
            >
              <CardContent className="p-6 text-center leading-tight w-full flex flex-col justify-center items-center">
                <span className="font-bold text-lg block">View</span>
                <span className="text-secondary text-2xl font-black uppercase tracking-tighter block my-1">Upcoming</span>
                <span className="font-bold text-xs opacity-70 tracking-widest uppercase block">Contests</span>
              </CardContent>
            </MotionCard>
          )}

          {/* ToDo List Card */}
          {visibleWidgets.includes('todos') && (
            <Card className="bg-card rounded-[2rem] border-[3px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary flex flex-col flex-1 shrink-0 relative min-h-[400px]">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-extrabold text-primary tracking-tight">ToDo List</h2>
                  <button onClick={() => setIsPriorityInfoOpen(true)} className="p-1 text-primary/40 hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-primary/10" title="How Priority Works">
                    <Info size={20} strokeWidth={3} />
                  </button>
                </div>
                
                {/* Dynamic Task Counter */}
                <span className="text-xs font-black bg-primary text-primary-foreground px-3 py-1 rounded-[1rem]">
                  {todos.length > 0 ? `${todos.filter(t=>!t.done).length} LEFT` : '...'}
                </span>
              </div>
              
              <div className="flex-1 w-full border-[3px] border-dashed border-primary/40 rounded-[2rem] flex flex-col overflow-hidden relative p-1 mt-2">
                 <div className="h-full w-full overflow-y-auto overflow-x-hidden">
                   <div className="p-3 pr-5 pb-10 w-full flex flex-col gap-3">
                    
                    {/* Sort and Map state ToDos */}
                    {(() => {
                      const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };
                      const priorityColors = { 
                        'high': 'border-destructive text-destructive shadow-destructive', 
                        'medium': 'border-[#eab308] text-[#eab308] shadow-[#eab308]', 
                        'low': 'border-primary text-primary shadow-primary' 
                      };
                      const sortedTodos = [...todos].sort((a, b) => {
                        if (a.done !== b.done) return a.done ? 1 : -1;
                        return (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
                      });
                      
                      return sortedTodos.length > 0 ? sortedTodos.map((item) => (
                        <motion.div 
                          key={item.id} 
                          whileHover={{ scale: 1.02, x: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleToggleTodo(item.id)}
                          className={`group w-full bg-background rounded-[1.5rem] p-3 px-5 border-[3px] flex items-center cursor-pointer transition-all shadow-[2px_2px_0px_var(--tw-shadow-color)] ${item.done ? 'opacity-50 bg-secondary/10 shadow-none translate-y-[2px] translate-x-[2px] border-primary text-primary' : priorityColors[item.priority || 'low']}`}
                        >
                            <motion.div 
                              animate={{ backgroundColor: item.done ? 'var(--secondary)' : 'var(--card)' }}
                              className={`w-5 h-5 rounded-[0.7rem] border-[3px] mr-3 flex shrink-0 items-center justify-center transition-colors ${item.done ? 'border-primary' : (item.priority==='high' ? 'border-destructive' : item.priority==='medium' ? 'border-[#eab308]' : 'border-primary')}`}
                            >
                              <AnimatePresence>
                                {item.done && (
                                  <motion.div 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }} 
                                    exit={{ scale: 0 }}
                                    className="w-2 h-2 bg-primary rounded-[0.3rem]" 
                                  />
                                )}
                              </AnimatePresence>
                            </motion.div>
                            
                            {editingTodoId === item.id ? (
                              <div className="flex-1 flex items-center gap-2 mr-2" onClick={(e)=>e.stopPropagation()}>
                                <input value={item.text} onChange={(e) => handleEditTodoTextChange(item.id, e.target.value)} className="flex-1 bg-transparent outline-none font-bold text-sm border-b-2 border-current px-1 text-current" autoFocus />
                                <select value={item.priority || 'low'} onChange={(e) => handleEditTodoPriorityChange(item.id, e.target.value)} className="bg-background font-bold rounded p-1 outline-none border-[2px] border-current cursor-pointer text-xs">
                                  <option value="low" className="text-primary font-bold">Low</option>
                                  <option value="medium" className="text-[#eab308] font-bold">Med</option>
                                  <option value="high" className="text-destructive font-bold">High</option>
                                </select>
                              </div>
                            ) : (
                              <span className={`font-bold tracking-wide flex-1 text-sm truncate ${item.done ? 'line-through' : ''}`}>
                                {item.text}
                              </span>
                            )}

                            {/* Hover Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 h-full">
                               <button onClick={(e) => handleEditTodoToggle(e, item.id)} className="p-1.5 hover:bg-current/10 rounded-md transition-colors text-current">
                                 <Pencil size={14} strokeWidth={3} />
                               </button>
                               <button onClick={(e) => handleDeleteTodo(e, item.id)} className="p-1.5 hover:bg-current/10 rounded-md transition-colors text-current">
                                 <Trash2 size={14} strokeWidth={3} />
                               </button>
                            </div>
                        </motion.div>
                      )) : (
                        // Skeleton Loaders
                        [1,2,3,4].map(idx => (
                          <div key={idx} className="animate-pulse h-12 w-full bg-muted rounded-[2rem]"></div>
                        ))
                      )
                    })()}

                   </div>
                 </div>
              </div>
              
              {/* Integrated Add Task Button */}
              <div className="w-full mt-4">
                <Button onClick={() => setIsAddTodoOpen(true)} className="w-full bg-secondary text-primary-foreground rounded-[1.2rem] py-6 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all font-black text-center tracking-widest uppercase text-sm h-auto active:translate-y-1 active:translate-x-1 active:shadow-none hover:shadow-[0px_0px_0px_var(--tw-shadow-color)]">
                  Add New Task
                </Button>
              </div>
            </CardContent>

           </Card>
          )}
        </div>

      </div>

      {/* =========================================================================
         PURE FOCUS MODALS (Backdrop Blurs)
      ========================================================================= */}

      {/* UPDATE CGPA MODAL */}
      {/* UPDATE CGPA MODAL - DELETED TO ENFORCE MATH-BASED SGPAs */}

      {/* ADD TRANSACTION MODAL */}
      <AnimatePresence>
        {isAddTransactionOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-md rounded-[2.5rem] border-[4px] border-primary shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative flex flex-col gap-6"
            >
              <Button onClick={() => setIsAddTransactionOpen(false)} variant="outline" className="absolute top-6 right-6 rounded-[1rem] w-12 h-12 p-0 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-destructive hover:text-destructive-foreground hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all">
                <X size={24} strokeWidth={3} />
              </Button>
              
              <h2 className="text-3xl font-black text-primary tracking-tight pr-12">New Entry</h2>
              
              <form onSubmit={handleAddTransaction} className="flex flex-col gap-5 mt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 font-black text-2xl">$</span>
                    <input 
                      type="number" value={newTxAmount} onChange={e => setNewTxAmount(e.target.value)}
                      placeholder="0.00" required
                      className="w-full bg-background border-[4px] border-primary rounded-[1.5rem] pl-10 pr-4 py-4 font-black text-2xl text-primary focus:outline-none focus:ring-4 ring-secondary/30 transition-all font-sans" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Reason</label>
                  <input 
                    type="text" value={newTxTitle} onChange={e => setNewTxTitle(e.target.value)}
                    placeholder="E.g., Dinner with friends" required
                    className="w-full bg-background border-[4px] border-primary rounded-[1.5rem] px-5 py-4 font-bold text-lg text-primary focus:outline-none focus:ring-4 ring-secondary/30 transition-all font-sans" 
                  />
                </div>

                <Button type="submit" className="w-full bg-secondary text-primary-foreground font-black text-xl py-8 mt-2 rounded-[1.5rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_var(--tw-shadow-color)] transition-all">
                  Save Transaction
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT TRANSACTION MODAL */}
      <AnimatePresence>
        {editingTx && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-lg p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-md rounded-[2.5rem] border-[4px] border-primary shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative flex flex-col gap-6"
            >
              <Button onClick={() => setEditingTx(null)} variant="outline" className="absolute top-6 right-6 rounded-[1rem] w-12 h-12 p-0 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-destructive hover:text-destructive-foreground hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all">
                <X size={24} strokeWidth={3} />
              </Button>
              
              <h2 className="text-3xl font-black text-primary tracking-tight pr-12">Edit Entry</h2>
              
              <form onSubmit={handleEditTransaction} className="flex flex-col gap-5 mt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 font-black text-2xl">$</span>
                    <input 
                      type="number" value={editingTx.amount} onChange={e => setEditingTx({...editingTx, amount: e.target.value})}
                      placeholder="0.00" required
                      className="w-full bg-background border-[4px] border-primary rounded-[1.5rem] pl-10 pr-4 py-4 font-black text-2xl text-primary focus:outline-none focus:ring-4 ring-secondary/30 transition-all font-sans" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Reason</label>
                  <input 
                    type="text" value={editingTx.title} onChange={e => setEditingTx({...editingTx, title: e.target.value})}
                    placeholder="E.g., Dinner with friends" required
                    className="w-full bg-background border-[4px] border-primary rounded-[1.5rem] px-5 py-4 font-bold text-lg text-primary focus:outline-none focus:ring-4 ring-secondary/30 transition-all font-sans" 
                  />
                </div>

                <Button type="submit" className="w-full bg-secondary text-primary-foreground font-black text-xl py-8 mt-2 rounded-[1.5rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_var(--tw-shadow-color)] transition-all">
                  Update Transaction
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SET BUDGET MODAL */}
      <AnimatePresence>
        {isBudgetOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-lg p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-sm rounded-[2.5rem] border-[4px] border-primary shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative flex flex-col gap-6"
            >
              <Button onClick={() => setIsBudgetOpen(false)} variant="outline" className="absolute top-6 right-6 rounded-[1rem] w-12 h-12 p-0 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-destructive hover:text-destructive-foreground hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all">
                <X size={24} strokeWidth={3} />
              </Button>
              
              <h2 className="text-3xl font-black text-primary tracking-tight pr-12">Update Budget</h2>
              
              <form onSubmit={handleSetBudget} className="flex flex-col gap-5 mt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Monthly Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 font-black text-2xl">$</span>
                    <input 
                      type="number" value={newBudgetAmount} onChange={e => setNewBudgetAmount(e.target.value)}
                      placeholder={budgetData.total.toString()} required
                      className="w-full bg-background border-[4px] border-primary rounded-[1.5rem] pl-10 pr-4 py-4 font-black text-2xl text-primary focus:outline-none focus:ring-4 ring-secondary/30 transition-all font-sans" 
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-secondary text-primary-foreground font-black text-xl py-6 mt-2 rounded-[1.5rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_var(--tw-shadow-color)] transition-all">
                  Set Target
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-xl rounded-[2.5rem] border-[4px] border-primary shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative flex flex-col gap-6 max-h-[85vh]"
            >
              <Button 
                onClick={() => setIsHistoryOpen(false)} 
                variant="outline" 
                className="absolute top-6 right-6 rounded-[1rem] w-12 h-12 p-0 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-destructive hover:text-destructive-foreground hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all z-20"
              >
                <X size={24} strokeWidth={3} />
              </Button>
              
              <h2 className="text-3xl font-black text-primary tracking-tight">History</h2>
              
              {/* Added min-h block to prevent squishing on empty state */}
              <div className="flex-1 w-full border-[4px] border-primary rounded-[2rem] bg-background flex flex-col overflow-hidden min-h-[300px]">
                <div className="flex-1 w-full p-2 relative overflow-y-auto overflow-x-hidden max-h-[50vh]">
                   <div className="flex flex-col gap-3 p-4 pr-6">
                     {transactions.length > 0 ? transactions.map(t => (
                       <motion.div 
                         initial={{ opacity: 0, x: -10 }} 
                         animate={{ opacity: 1, x: 0 }} 
                         exit={{ opacity: 0, x: -10 }}
                         key={t.id} 
                         className="flex items-center justify-between border-b-[3px] border-primary/10 pb-4 mb-2 last:border-0 last:mb-0 group"
                       >
                         {/* Text info block */}
                         <div className="flex flex-col">
                           <span className="font-bold text-primary text-lg">{t.title}</span>
                           <span className="text-xs font-black tracking-widest uppercase text-primary/50">{t.date}</span>
                         </div>
                         
                         {/* Trailing actions and price */}
                         <div className="flex items-center gap-4">
                            {/* Actions block - visible on hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                               <Button 
                                 size="sm" variant="outline" 
                                 onClick={() => openEditModal(t)}
                                 className="h-8 w-8 p-0 rounded-[0.5rem] border-2 border-primary hover:bg-muted text-primary transition-all shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none translate-y-[-2px] translate-x-[-2px] hover:translate-y-0 hover:translate-x-0"
                               >
                                 <Pencil size={14} strokeWidth={3} />
                               </Button>
                               <Button 
                                 size="sm" variant="destructive" 
                                 onClick={() => handleDeleteTransaction(t.id)}
                                 className="h-8 w-8 p-0 rounded-[0.5rem] border-2 border-primary hover:bg-destructive/90 transition-all shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none translate-y-[-2px] translate-x-[-2px] hover:translate-y-0 hover:translate-x-0"
                               >
                                 <Trash2 size={14} strokeWidth={3} />
                               </Button>
                            </div>
                            {/* Price */}
                            <span className="font-black text-2xl text-secondary min-w-[5rem] text-right">
                              -${(t.amount || 0).toFixed(2)}
                            </span>
                         </div>
                       </motion.div>
                     )) : (
                       <div className="py-10 text-center font-bold text-primary/50 uppercase tracking-widest">
                         No transactions yet
                       </div>
                     )}
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* HABIT MANAGEMENT MODAL */}
      <AnimatePresence>
        {isHabitsOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-xl rounded-[2.5rem] border-[4px] border-primary shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative flex flex-col gap-6 max-h-[85vh]"
            >
              <Button 
                onClick={() => setIsHabitsOpen(false)} 
                variant="outline" 
                className="absolute top-6 right-6 rounded-[1rem] w-12 h-12 p-0 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-destructive hover:text-destructive-foreground hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all z-20"
              >
                <X size={24} strokeWidth={3} />
              </Button>
              
              <h2 className="text-3xl font-black text-primary tracking-tight">Manage Habits</h2>
              
              <form onSubmit={handleAddHabit} className="flex gap-3">
                 <input 
                   type="text" value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)}
                   placeholder="New habit..." 
                   className="flex-1 bg-background border-[4px] border-primary rounded-[1.5rem] px-5 py-3 font-bold text-lg text-primary focus:outline-none focus:ring-4 ring-secondary/30 transition-all min-w-0" 
                 />
                 <Button type="submit" className="bg-secondary text-primary-foreground font-black px-6 py-3 rounded-[1.5rem] border-[4px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all h-auto shrink-0">
                   <Plus size={24} strokeWidth={3} />
                 </Button>
              </form>

              <div className="flex-1 w-full border-[4px] border-primary rounded-[2rem] bg-background flex flex-col overflow-hidden min-h-[300px]">
                <div className="flex-1 w-full p-2 relative overflow-y-auto overflow-x-hidden max-h-[45vh]">
                   <div className="flex flex-col gap-3 p-4 pr-6">
                     {habits.length > 0 ? habits.map(h => (
                       <motion.div 
                         initial={{ opacity: 0, x: -10 }} 
                         animate={{ opacity: 1, x: 0 }} 
                         exit={{ opacity: 0, x: -10 }}
                         key={h.id} 
                         className={`flex flex-col sm:flex-row sm:items-center justify-between border-[3px] border-primary p-4 rounded-[1.5rem] mb-2 gap-4 transition-all ${h.isActive === false ? 'opacity-50 bg-muted/50' : 'bg-card shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary'}`}
                       >
                         {/* Text info and streak */}
                         <div className="flex items-center gap-3 overflow-hidden flex-1">
                           <div className="flex items-center justify-center p-2 bg-primary/5 rounded-xl border-[2px] border-primary/20 shrink-0">
                              <Flame size={20} className={h.streak > 2 ? 'text-[#ff4500]' : 'text-primary/40'} fill={h.streak > 2 ? '#ff4500' : 'none'} />
                              <span className="font-black ml-1 text-lg leading-none">{h.streak || 0}</span>
                           </div>
                           
                           {editingHabitId === h.id ? (
                             <input 
                               type="text" autoFocus
                               value={h.text}
                               onChange={(e) => handleEditHabitTextChange(h.id, e.target.value)}
                               onBlur={() => handleEditHabitToggle(h)}
                               onKeyDown={(e) => e.key === 'Enter' && handleEditHabitToggle(h)}
                               className="flex-1 bg-background border-b-[3px] border-primary outline-none font-bold text-lg p-1 min-w-0"
                             />
                           ) : (
                             <span className={`font-bold text-primary text-lg truncate flex-1 ${h.isActive === false ? 'line-through' : ''}`}>{h.text}</span>
                           )}
                         </div>
                         
                         {/* Actions block */}
                         <div className="flex items-center gap-2 shrink-0">
                            <Button 
                              size="sm" variant="outline" 
                              onClick={() => handleToggleHabitActive(h.id)}
                              className={`h-10 w-10 p-0 rounded-xl border-[3px] border-primary transition-all shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none translate-y-[-2px] translate-x-[-2px] hover:translate-y-0 hover:translate-x-0 ${h.isActive === false ? 'bg-muted text-primary' : 'bg-primary text-primary-foreground'}`}
                              title={h.isActive !== false ? "Pause Habit" : "Resume Habit"}
                            >
                              <Power size={18} strokeWidth={3} />
                            </Button>
                            <Button 
                              size="sm" variant="outline" 
                              onClick={() => handleEditHabitToggle(h)}
                              className={`h-10 w-10 p-0 rounded-xl border-[3px] border-primary transition-all shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none translate-y-[-2px] translate-x-[-2px] hover:translate-y-0 hover:translate-x-0 ${editingHabitId === h.id ? 'bg-secondary text-primary' : 'bg-card text-primary'}`}
                            >
                              {editingHabitId === h.id ? <Check size={18} strokeWidth={3} /> : <Pencil size={18} strokeWidth={3} />}
                            </Button>
                            <Button 
                              size="sm" variant="destructive" 
                              onClick={() => handleDeleteHabit(h.id)}
                              className="h-10 w-10 p-0 rounded-xl border-[3px] border-primary hover:bg-destructive/90 transition-all shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none translate-y-[-2px] translate-x-[-2px] hover:translate-y-0 hover:translate-x-0"
                            >
                              <Trash2 size={18} strokeWidth={3} />
                            </Button>
                         </div>
                       </motion.div>
                     )) : (
                       <div className="py-10 text-center font-bold text-primary/50 uppercase tracking-widest">
                         No habits to track.
                       </div>
                     )}
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add ToDo Modal */}
      <AnimatePresence>
        {isAddTodoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-[2rem] border-[4px] border-primary p-6 shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary relative flex flex-col"
            >
              <button 
                onClick={() => setIsAddTodoOpen(false)} 
                className="absolute top-4 right-4 p-2 bg-muted text-primary rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer border-[2px] border-transparent hover:border-destructive"
              >
                <X size={20} strokeWidth={3} />
              </button>
              
              <h3 className="text-2xl font-black mb-6 uppercase tracking-wider text-primary">New Task</h3>
              
              <form onSubmit={handleAddTodo} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm uppercase tracking-widest opacity-70">Task Title</label>
                  <input 
                    type="text" autoFocus
                    placeholder="E.g., Review pull requests..." 
                    value={newTodoTitle} 
                    onChange={(e) => setNewTodoTitle(e.target.value)} 
                    className="w-full bg-background border-[3px] border-primary rounded-xl px-4 py-3 font-bold text-lg text-primary focus:outline-none focus:ring-4 ring-secondary/30 transition-all font-medium placeholder:opacity-50"
                  />
                </div>
                
                <div className="flex flex-col gap-2 mb-2">
                  <label className="font-bold text-sm uppercase tracking-widest opacity-70">Priority Level</label>
                  <select 
                    value={newTodoPriority} 
                    onChange={(e) => setNewTodoPriority(e.target.value)} 
                    className="w-full bg-background border-[3px] border-primary rounded-xl px-4 py-3 font-bold text-lg outline-none cursor-pointer hover:bg-muted/50 transition-colors appearance-none"
                  >
                    <option value="low" className="font-bold text-primary">Low Priority (Whenever)</option>
                    <option value="medium" className="font-bold text-[#eab308]">Medium Priority (Soon)</option>
                    <option value="high" className="font-bold text-destructive">High Priority (Urgent)</option>
                  </select>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!newTodoTitle.trim()} 
                  className="w-full bg-primary text-primary-foreground font-black px-6 py-6 rounded-xl border-[4px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-secondary hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all text-lg tracking-widest uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Priority Info Modal */}
      <AnimatePresence>
        {isPriorityInfoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm mt-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-[2rem] border-[4px] border-primary p-6 shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary relative flex flex-col"
            >
              <button onClick={() => setIsPriorityInfoOpen(false)} className="absolute top-4 right-4 p-2 bg-muted text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer border-[2px] border-transparent hover:border-primary">
                <X size={20} strokeWidth={3} />
              </button>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-wider text-primary">Priority System</h3>
              <p className="font-bold text-sm opacity-80 mb-6 leading-relaxed">
                Tasks are automatically sorted to keep you focused on what matters most. Incomplete tasks always float to the top, sorted strictly by their priority level.
              </p>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 p-3 rounded-xl border-[2px] border-destructive bg-destructive/5 text-destructive font-bold">
                  <div className="w-4 h-4 rounded shadow-sm border-[2px] border-destructive bg-destructive/20 shrink-0"></div>
                  <span>High Priority (Urgent)</span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-xl border-[2px] border-[#eab308] bg-[#eab308]/5 text-[#eab308] font-bold">
                  <div className="w-4 h-4 rounded shadow-sm border-[2px] border-[#eab308] bg-[#eab308]/20 shrink-0"></div>
                  <span>Medium Priority (Soon)</span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-xl border-[2px] border-primary bg-primary/5 text-primary font-bold">
                  <div className="w-4 h-4 rounded shadow-sm border-[2px] border-primary bg-primary/20 shrink-0"></div>
                  <span>Low Priority (Whenever)</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upcoming Contests Modal */}
      <AnimatePresence>
        {isContestsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={() => setIsContestsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-2xl rounded-[3rem] border-[4px] border-primary shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary relative flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-primary p-10 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border-[2px] border-white/30 shadow-xl">
                      <Trophy size={32} strokeWidth={2.5} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none mb-2">Battlegrounds</h2>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Live Frequencies Detected</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsContestsOpen(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer border-[2px] border-white/10 hover:border-white/30"
                  >
                    <X size={24} strokeWidth={3} />
                  </button>
                </div>
                <div className="mt-8 flex items-center justify-between relative z-10">
                   <p className="text-sm font-bold text-white/50 tracking-wide uppercase">All Platforms · 48h Window</p>
                   <button 
                    onClick={loadContests}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-primary rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border-[2px] border-white/10 hover:border-white group"
                   >
                     <RefreshCw size={14} strokeWidth={3} className={`group-hover:rotate-180 transition-transform duration-500 ${isContestsLoading ? 'animate-spin' : ''}`} />
                     Refresh
                   </button>
                </div>
              </div>

              {/* Contest List */}
              <div className="flex-1 overflow-y-auto p-8 bg-background/30">
                {isContestsLoading && contests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-[4px] border-primary/10 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-primary/40 uppercase tracking-[0.3em] animate-pulse">Scanning Transmissions...</p>
                  </div>
                ) : contests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-primary/5 rounded-[2rem] border-[3px] border-dashed border-primary/20">
                    <AlertCircle size={40} className="text-primary/20 mb-4" />
                    <p className="text-sm font-bold text-primary/40 italic">No signals detected in the next 48 hours.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {contests.map((c, i) => {
                      const startTime = new Date(c.startTime);
                      const diffMs = startTime - new Date();
                      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      let Icon = Trophy;
                      let themeColor = 'var(--primary)';
                      let platformName = c.platform;
                      if (c.platform === 'leetcode') { Icon = Code; themeColor = '#ffa116'; platformName = 'LeetCode'; }
                      if (c.platform === 'codeforces') { Icon = BarChart4; themeColor = '#ff3333'; platformName = 'Codeforces'; }
                      if (c.platform === 'codechef') { Icon = Pizza; themeColor = '#7d5c46'; platformName = 'CodeChef'; }
                      return (
                        <motion.a
                          key={i}
                          href={c.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          style={{ '--accent': themeColor }}
                          className="group relative bg-card border-[3px] border-primary/10 p-5 rounded-[1.8rem] flex items-center gap-5 transition-all hover:bg-primary/5 hover:border-primary/40 hover:translate-x-2 cursor-pointer shadow-none hover:shadow-[6px_6px_0px_var(--accent)]"
                        >
                          <div style={{ backgroundColor: themeColor }} className="absolute left-0 top-1/4 bottom-1/4 w-1.5 rounded-r-full shadow-[0_0_15px_var(--accent)] opacity-60 group-hover:opacity-100"></div>
                          <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border-[2px] border-primary/5 group-hover:border-primary/20 transition-colors">
                            <Icon size={24} style={{ color: themeColor }} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-black text-primary truncate leading-tight mb-2 pr-4">{c.title}</h4>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-black bg-primary/5 text-primary/60 px-2 py-1 rounded-md uppercase tracking-widest border border-primary/5">{platformName}</span>
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-primary/40 uppercase tracking-widest">
                                <Calendar size={12} strokeWidth={3} />
                                {startTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </div>
                              <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${days < 1 ? 'text-secondary' : 'text-green-500'}`}>
                                <Timer size={12} strokeWidth={3} />
                                {days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h left` : 'Soon'}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-primary/20 group-hover:text-primary group-hover:translate-x-1 transition-all" strokeWidth={3} />
                        </motion.a>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Settings Modal */}
      <AnimatePresence>
        {isCalendarSettingsOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card w-full max-w-sm rounded-[2rem] border-[4px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b-[3px] border-primary flex justify-between items-center bg-primary/5">
                <h2 className="text-xl font-black text-primary uppercase tracking-tight flex items-center gap-2">
                  <Settings size={20} strokeWidth={3} /> Filtering
                </h2>
                <button onClick={() => setIsCalendarSettingsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-primary/40 uppercase tracking-widest mb-3">My Calendars</h3>
                    <div className="space-y-2">
                      {calendarSources.filter(s => s.type === 'calendar').map(source => (
                        <label key={source.id} className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-xl cursor-pointer transition-colors group">
                          <div className="relative flex items-center justify-center w-5 h-5">
                            <input 
                              type="checkbox" 
                              className="peer appearance-none w-5 h-5 border-[2px] border-primary rounded bg-background checked:bg-primary transition-colors cursor-pointer"
                              checked={selectedSources.has(source.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedSources);
                                if (e.target.checked) newSet.add(source.id);
                                else newSet.delete(source.id);
                                setSelectedSources(newSet);
                              }}
                            />
                            <Check size={12} strokeWidth={4} className="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" />
                          </div>
                          <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: source.color }} />
                          <span className="text-sm font-bold text-primary truncate flex-1 group-hover:text-secondary">{source.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {calendarSources.filter(s => s.type === 'tasklist').length > 0 && (
                    <div>
                      <h3 className="text-xs font-black text-primary/40 uppercase tracking-widest mb-3">Task Lists</h3>
                      <div className="space-y-2">
                        {calendarSources.filter(s => s.type === 'tasklist').map(source => (
                          <label key={source.id} className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-xl cursor-pointer transition-colors group">
                            <div className="relative flex items-center justify-center w-5 h-5">
                              <input 
                                type="checkbox" 
                                className="peer appearance-none w-5 h-5 border-[2px] border-primary rounded bg-background checked:bg-primary transition-colors cursor-pointer"
                                checked={selectedSources.has(source.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedSources);
                                  if (e.target.checked) newSet.add(source.id);
                                  else newSet.delete(source.id);
                                  setSelectedSources(newSet);
                                }}
                              />
                              <Check size={12} strokeWidth={4} className="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" />
                            </div>
                            <span className="text-sm font-bold text-primary truncate flex-1 group-hover:text-secondary">{source.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t-[3px] border-primary/10">
                <Button onClick={() => setIsCalendarSettingsOpen(false)} className="w-full bg-primary text-primary-foreground font-black py-6 rounded-2xl tracking-widest uppercase hover:bg-secondary transition-colors cursor-pointer shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-secondary hover:shadow-none hover:translate-x-1 hover:translate-y-1">
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOMIZE WIDGETS MODAL */}
      <AnimatePresence>
        {isCustomizeModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-md rounded-[2.5rem] border-[4px] border-primary shadow-[10px_10px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative flex flex-col"
            >
              <Button onClick={() => setIsCustomizeModalOpen(false)} variant="outline" className="absolute top-6 right-6 rounded-[1rem] w-10 h-10 p-0 border-[3px] border-primary shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-destructive hover:text-destructive-foreground hover:translate-y-0.5 hover:shadow-none transition-all z-10">
                <X size={20} strokeWidth={3} />
              </Button>
              
              <h2 className="text-2xl font-black text-primary tracking-tight mb-6 uppercase italic">Customize Widgets</h2>
              
              <div className="space-y-4">
                {[
                  { id: 'cgpa', label: 'CGPA Widget' },
                  { id: 'budget', label: 'Budget/Spent Tracker' },
                  { id: 'habits', label: 'Habit Tracker' },
                  { id: 'calendar', label: 'Calendar Grid' },
                  { id: 'contests', label: 'Upcoming Contests Link' },
                  { id: 'todos', label: 'ToDo List' }
                ].map(w => {
                  const isChecked = visibleWidgets.includes(w.id);
                  return (
                    <label key={w.id} className="flex items-center gap-4 p-3 hover:bg-primary/5 rounded-2xl cursor-pointer transition-colors border-[3px] border-primary/10 hover:border-primary/20">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={async (e) => {
                          let updated;
                          if (e.target.checked) {
                            updated = [...visibleWidgets, w.id];
                          } else {
                            updated = visibleWidgets.filter(x => x !== w.id);
                          }
                          setVisibleWidgets(updated);
                          if (user) {
                            await supabase.from('user_settings').update({ visible_widgets: updated }).eq('user_id', user.id);
                          }
                        }}
                        className="w-5 h-5 border-[3px] border-primary rounded bg-background checked:bg-primary transition-colors cursor-pointer"
                      />
                      <span className="font-extrabold text-sm text-primary uppercase tracking-wider">{w.label}</span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
