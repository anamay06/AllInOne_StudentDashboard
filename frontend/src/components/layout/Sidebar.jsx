import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Briefcase, GraduationCap, Calendar, Rocket, FolderGit2, Trophy, Zap, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Academics', path: '/academics', icon: GraduationCap },
  { name: 'Internship', path: '/internship', icon: Rocket },
  { name: 'Projects', path: '/projects', icon: FolderGit2 },
  { name: 'About Me', path: '/about', icon: User },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  
  const [displayName, setDisplayName] = useState(null);

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!user) return;
      // Fetch real name from users table (where About Me saves it)
      const { data: userData } = await supabase.from('users').select('full_name').eq('id', user.id).single();
      if (userData?.full_name) {
        setDisplayName(userData.full_name);
      }
    };
    fetchSidebarData();
  }, [user]);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (displayName) return displayName;
    if (!user) return 'Hacker';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Hacker';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  const sidebarClasses = "fixed inset-y-0 left-0 z-40 w-72 bg-card border-r-4 border-primary shadow-[8px_0px_0px_var(--tw-shadow-color)] shadow-muted xl:shadow-none xl:static flex flex-col transform transition-transform duration-300 ease-in-out px-4 py-4 overflow-y-auto scrollbar-hide";
  const mobileTranslate = isOpen ? "translate-x-0" : "-translate-x-full";
  const desktopTranslate = "xl:translate-x-0";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-30 xl:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`${sidebarClasses} ${mobileTranslate} ${desktopTranslate}`}>
        <div className="flex flex-col h-full min-h-0">
          <div className="mb-6 px-2 mt-4 xl:mt-0 relative flex flex-col items-start shrink-0">
            <p className="font-bold text-sm text-primary/60 uppercase tracking-widest mb-1">{getGreeting()}</p>
            <h2 className="font-handwriting text-primary text-5xl leading-none mb-3">{getUserName()}</h2>
          </div>

          <div className="flex-1 -mx-2 mt-2 min-h-0">
            <div className="mx-4 mb-4 p-1 bg-primary/5 rounded-[2.5rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/10 overflow-hidden flex flex-col min-h-[300px] h-full">
              <div className="px-6 py-4 border-b-[3px] border-primary/10 bg-primary/5 flex items-center justify-center">
                <span className="font-black text-3xl tracking-tighter text-primary uppercase italic">AIM</span>
              </div>
              <ScrollArea className="flex-1">
                <nav className="space-y-1.5 p-3">
                  {navItems.map((item, index) => {
                    const isActive = item.path === '/' 
                      ? location.pathname === '/' 
                      : location.pathname.startsWith(item.path);

                    return (
                      <NavLink 
                        key={index} 
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center px-4 py-2.5 rounded-xl group transition-all duration-200 border-[3px]
                          ${isActive 
                            ? 'bg-primary text-primary-foreground border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary' 
                            : 'bg-transparent text-foreground border-transparent hover:border-primary/20 hover:bg-primary/5'
                          }`}
                      >
                        <item.icon size={18} strokeWidth={2.5} className={`mr-3 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                        <span className="font-bold tracking-tight text-sm xl:text-base">{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </ScrollArea>
            </div>
          </div>

          <div className="mt-auto pt-4 space-y-3 shrink-0 pb-2">
            <Button 
              onClick={() => {
                setIsOpen(false);
                navigate('/zen-mode');
              }}
              className="w-full flex items-center justify-center h-auto px-4 py-3.5 bg-background border-[3px] border-primary text-primary rounded-[2rem] hover:bg-primary hover:text-primary-foreground transition-all duration-300 group shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none hover:translate-y-1 hover:translate-x-1"
            >
              <Zap size={20} className="mr-3 group-hover:text-secondary-foreground text-secondary" />
              <span className="font-extrabold tracking-widest text-base uppercase">Zen Mode</span>
            </Button>

            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full flex items-center justify-center h-auto px-4 py-2.5 border-[3px] border-destructive text-destructive rounded-[1.5rem] hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 font-bold tracking-widest text-xs uppercase"
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
