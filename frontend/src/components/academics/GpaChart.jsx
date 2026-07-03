import React from 'react';
import { motion } from 'framer-motion';

export default function GpaChart({ semesters }) {
  const maxGpa = 10;

  return (
    <div className="bg-card rounded-2xl border-[3px] border-primary/20 p-5 sm:p-6 hover:border-primary/40 transition-colors duration-300">
      <h3 className="text-lg font-black text-foreground tracking-tight mb-1">GPA Trend</h3>
      <p className="text-xs text-muted-foreground font-semibold mb-6">Semester-wise performance</p>

      <div className="flex items-end gap-2 sm:gap-3 h-44 sm:h-52">
        {semesters.map((sem, i) => {
          const heightPercent = (sem.gpa / maxGpa) * 100;
          const isHighest = sem.gpa === Math.max(...semesters.map((s) => s.gpa));

          return (
            <div key={sem.id} className="flex-1 flex flex-col items-center gap-2 group">
              {/* GPA value on top */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="text-xs font-black text-primary"
              >
                {sem.gpa}
              </motion.span>

              {/* Bar */}
              <div className="w-full flex items-end h-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: i * 0.12, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`academics-gpa-bar w-full rounded-t-xl cursor-pointer ${
                    isHighest
                      ? 'bg-gradient-to-t from-emerald-500 to-green-400'
                      : 'bg-gradient-to-t from-primary/70 to-primary/40'
                  }`}
                  title={`${sem.name}: ${sem.gpa} GPA`}
                />
              </div>

              {/* Semester label */}
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">
                {sem.shortName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
