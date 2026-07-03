import React from 'react';
import { motion } from 'framer-motion';
import { getAttendanceColor } from './academicsData';

export default function AttendanceTracker({ courses }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  // Calculate overall attendance
  const overall =
    courses.length > 0
      ? Math.round(courses.reduce((sum, c) => sum + c.attendance, 0) / courses.length)
      : 0;

  return (
    <div className="bg-card rounded-2xl border-[3px] border-primary/20 p-5 sm:p-6 hover:border-primary/40 transition-colors duration-300">
      <h3 className="text-lg font-black text-foreground tracking-tight mb-1">Attendance</h3>
      <p className="text-xs text-muted-foreground font-semibold mb-5">Current semester overview</p>

      {/* Overall Ring */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} className="academics-ring-track" />
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              className="academics-ring-fill"
              stroke={getAttendanceColor(overall)}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (overall / 100) * circumference }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black text-foreground">{overall}%</span>
          </div>
        </div>
      </div>

      {/* Per-course bars */}
      <div className="space-y-3 academics-scroll max-h-48 overflow-y-auto pr-1">
        {courses.map((course, i) => (
          <motion.div
            key={course.code}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.06 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-muted-foreground truncate max-w-[60%]">
                {course.code}
              </span>
              <span
                className="text-xs font-black"
                style={{ color: getAttendanceColor(course.attendance) }}
              >
                {course.attendance}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.attendance}%` }}
                transition={{ delay: 0.6 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: getAttendanceColor(course.attendance) }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
