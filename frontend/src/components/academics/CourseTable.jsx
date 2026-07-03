import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { getGradeColor } from './academicsData';

const tableRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function CourseTable({ courses, semesterName }) {
  return (
    <div className="bg-card rounded-2xl border-[3px] border-primary/20 p-5 sm:p-6 hover:border-primary/40 transition-colors duration-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-black text-foreground tracking-tight">Courses</h3>
          <p className="text-xs text-muted-foreground font-semibold">{semesterName}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
          <BookOpen size={14} className="text-primary" strokeWidth={2.5} />
          <span className="text-xs font-bold text-primary">{courses.length} Courses</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-3 py-2 mb-2">
        <span className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Code</span>
        <span className="col-span-5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Course</span>
        <span className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Credits</span>
        <span className="col-span-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Grade</span>
      </div>

      {/* Table Body */}
      <div className="space-y-1 academics-scroll max-h-[320px] overflow-y-auto pr-1">
        {courses.map((course, i) => (
          <motion.div
            key={course.code}
            custom={i}
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            className="academics-course-row grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl"
          >
            <span className="col-span-2 text-xs font-bold text-primary">{course.code}</span>
            <span className="col-span-5 text-xs font-semibold text-foreground truncate">{course.name}</span>
            <span className="col-span-2 text-xs font-bold text-muted-foreground text-center">{course.credits}</span>
            <div className="col-span-3 flex justify-center">
              <span
                className={`${getGradeColor(course.grade)} text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider`}
              >
                {course.grade}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
