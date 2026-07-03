import React from 'react';
import CgpaSection from './CgpaSection';
import AssignmentsSection from './AssignmentsSection';
import ResourcesSection from './ResourcesSection';
import { motion } from 'framer-motion';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export default function AcademicsDashboard() {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 pb-20 lg:pb-0 relative z-10"
    >
      <CgpaSection />
      
      <div className="flex flex-col gap-6 w-full">
        <AssignmentsSection />
        <ResourcesSection />
      </div>
    </motion.div>
  );
}
