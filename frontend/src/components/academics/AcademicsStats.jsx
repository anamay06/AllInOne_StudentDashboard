import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, TrendingUp, Award } from 'lucide-react';
import { calculateCGPA, getOverallAttendance } from './academicsData';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function AcademicsStats({ semesters }) {
  const { user } = useAuth();
  const [cgpa, setCgpa] = useState(() => calculateCGPA(semesters));

  useEffect(() => {
    const fetchCgpa = async () => {
      if (!user) return;
      const { data } = await supabase.from('user_settings').select('cgpa').eq('user_id', user.id).limit(1);
      if (data && data.length > 0 && data[0].cgpa !== undefined) {
        setCgpa(Number(data[0].cgpa));
      }
    };
    fetchCgpa();
  }, [user, semesters]);

  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);
  const totalCredits = semesters.reduce((sum, s) => sum + s.totalCredits, 0);
  const allCourses = semesters.flatMap((s) => s.courses);
  const overallAttendance = getOverallAttendance(allCourses);

  const stats = [
    {
      label: 'CGPA',
      value: typeof cgpa === 'number' ? cgpa.toFixed(2) : cgpa,
      icon: GraduationCap,
      color: 'from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      label: 'Total Credits',
      value: totalCredits,
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      label: 'Courses Done',
      value: totalCourses,
      icon: TrendingUp,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
    },
    {
      label: 'Attendance',
      value: `${overallAttendance}%`,
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          custom={i}
          variants={statVariants}
          initial="hidden"
          animate="visible"
          className={`relative overflow-hidden rounded-2xl border-[3px] border-primary/20 bg-card p-4 sm:p-5 hover:border-primary/40 transition-colors duration-300 shadow-lg ${stat.shadow}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`academics-stat-icon p-2 rounded-xl bg-gradient-to-br ${stat.color}`}>
              <stat.icon size={18} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
          {/* Decorative corner accent */}
          <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} opacity-10`} />
        </motion.div>
      ))}
    </div>
  );
}
