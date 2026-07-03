import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-[100dvh] w-full bg-background p-2 sm:p-3 md:p-4 overflow-hidden relative">
      <div className="flex h-full w-full bg-background font-sans overflow-hidden border-[3px] border-primary/20 focus-within:border-primary/50 transition-all duration-500 rounded-[2rem] sm:rounded-[2.5rem] relative shadow-sm">
        <div className="xl:hidden absolute top-0 left-0 right-0 h-20 bg-card border-b-4 border-primary flex items-center justify-between px-6 z-20">
          <h1 className="text-3xl font-black text-primary tracking-tighter">AIM.</h1>
          <Button 
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-background rounded-full border-2 border-primary shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary active:shadow-none active:translate-y-[2px] active:translate-x-[2px] h-12 w-12"
          >
            {isMobileMenuOpen ? <X size={28} strokeWidth={3} className="text-primary" /> : <Menu size={28} strokeWidth={3} className="text-primary" />}
          </Button>
        </div>

        <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

        <main className="flex-1 h-full overflow-y-auto relative">
          <div className="hidden xl:block fixed top-10 right-10 z-0 pointer-events-none">
               <h1 className="text-6xl font-black text-muted opacity-50 tracking-tighter">AIM.</h1>
          </div>
          <div className="p-6 pt-24 xl:p-10 min-h-full flex flex-col relative z-10 w-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
