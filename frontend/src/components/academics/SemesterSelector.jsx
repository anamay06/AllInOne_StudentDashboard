import React from 'react';
import { motion } from 'framer-motion';

export default function SemesterSelector({ semesters, activeSemester, onSelect }) {
  return (
    <div className="bg-card rounded-2xl border-[3px] border-primary/20 p-3 hover:border-primary/40 transition-colors duration-300">
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto academics-scroll pb-1">
        {semesters.map((sem) => {
          const isActive = activeSemester === sem.id;
          return (
            <button
              key={sem.id}
              onClick={() => onSelect(sem.id)}
              className={`academics-semester-tab flex-shrink-0 relative px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[3px_3px_0px_var(--tw-shadow-color)] shadow-primary/50 active'
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="academics-semester-indicator"
                  className="absolute inset-0 bg-primary rounded-xl"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{sem.shortName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
