import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AcademicsStats from './AcademicsStats';
import GpaChart from './GpaChart';
import AttendanceTracker from './AttendanceTracker';
import CourseTable from './CourseTable';
import SemesterSelector from './SemesterSelector';
import AssignmentsTracker from './AssignmentsTracker';
import { semesterData } from './academicsData';
import './academics.css';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function AcademicsOverview() {
  const [activeSemesterId, setActiveSemesterId] = useState(
    semesterData[semesterData.length - 1].id
  );

  const activeSemester = semesterData.find((s) => s.id === activeSemesterId) || semesterData[0];

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[1400px] mx-auto flex flex-col gap-5 pb-20 lg:pb-0 relative z-10"
    >
      {/* Page Title */}
      <motion.div variants={sectionVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Academics
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Track your academic journey
          </p>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={sectionVariants}>
        <AcademicsStats semesters={semesterData} />
      </motion.div>

      {/* Semester Selector */}
      <motion.div variants={sectionVariants}>
        <SemesterSelector
          semesters={semesterData}
          activeSemester={activeSemesterId}
          onSelect={setActiveSemesterId}
        />
      </motion.div>

      {/* Main Content Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSemesterId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          {/* Course Table & Assignments — takes 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <CourseTable courses={activeSemester.courses} semesterName={activeSemester.name} />
            <AssignmentsTracker />
          </div>

          {/* Right Column — Attendance + GPA */}
          <div className="flex flex-col gap-5">
            <AttendanceTracker courses={activeSemester.courses} />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* GPA Chart — full width */}
      <motion.div variants={sectionVariants}>
        <GpaChart semesters={semesterData} />
      </motion.div>
    </motion.div>
  );
}
