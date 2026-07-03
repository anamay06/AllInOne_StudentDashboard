import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Github, 
  ExternalLink, 
  Terminal, 
  Cpu, 
  Clock, 
  Bot, 
  ChevronLeft,
  Activity,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTechData } from '@/lib/techDictionary';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// --- MOCK DATA ---
const MOCK_PROJECTS = [
  {
    id: 1,
    title: "EcoTrack AI",
    status: "Deployed",
    description: "Machine learning platform to track carbon footprint using satellite imagery and real-time sensor data.",
    techStack: ["React", "Python", "ML"],
    progress: 100,
    githubUrl: "#",
    demoUrl: "#",
    category: "Team Projects"
  },
  {
    id: 2,
    title: "NeuroFinance Workflow",
    status: "In Progress",
    description: "Algorithmic trading bot powered by deep neural networks analyzing sentiment across financial news networks.",
    techStack: ["Node.js", "Python", "AI"],
    progress: 65,
    githubUrl: "#",
    demoUrl: null,
    category: "Self Made"
  },
  {
    id: 3,
    title: "VibePlaylist Generator",
    status: "Vibecoded",
    description: "AI agent that generates Spotify playlists based on textual mood descriptions and current weather parameters.",
    techStack: ["React", "OpenAI", "Tailwind"],
    progress: 100,
    githubUrl: "#",
    demoUrl: "#",
    category: "Vibecoded"
  },
  {
    id: 4,
    title: "RustOS Configurator",
    status: "In Progress",
    description: "A fast, memory-safe CLI tool for managing dotfiles and system configurations across Linux machines.",
    techStack: ["Rust", "CLI", "Linux"],
    progress: 30,
    githubUrl: "#",
    demoUrl: null,
    category: "Self Made"
  }
];

const FILTER_TABS = ["All Projects", "Deployed", "In Progress", "Self Made", "Team Projects", "Vibecoded"];

// Helper to get status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'Deployed': return 'text-primary bg-primary/10 border-primary';
    case 'In Progress': return 'text-secondary bg-secondary/10 border-secondary';
    case 'Vibecoded': return 'text-accent-foreground bg-accent/20 border-accent-foreground';
    default: return 'text-primary bg-primary/10 border-primary';
  }
};

const getProgressBarColor = (status) => {
  switch (status) {
    case 'Deployed': return 'bg-primary';
    case 'In Progress': return 'bg-secondary';
    case 'Vibecoded': return 'bg-accent-foreground';
    default: return 'bg-primary';
  }
};

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      const { data } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setProjects(data.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          category: p.category,
          techStack: p.tech_stack || [],
          progress: p.progress,
          githubUrl: p.github_url,
          demoUrl: p.demo_url,
          hoursLogged: Number(p.hours_logged)
        })));
      } else {
        // Fallback to empty if active user exists but no projects yet
        setProjects([]);
      }
      
      // Fetch Active Session (if user refreshed the page while checked in)
      const { data: activeLog } = await supabase.from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (activeLog) {
        setActiveSession({
          logId: activeLog.id,
          projectId: activeLog.project_id,
          startTime: new Date(activeLog.start_time)
        });
      }
    };
    fetchProjects();
  }, [user]);
  const [activeTab, setActiveTab] = useState("All Projects");
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Add Project Modal State
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '', description: '', status: 'In Progress', category: 'Self Made', techStack: '', githubUrl: '', demoUrl: '', hoursLogged: 0
  });

  // Terminal Animation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  
  // Filter Logic
  const filteredProjects = projects.filter(p => {
    if (activeTab === "All Projects") return true;
    if (activeTab === "Self Made" || activeTab === "Team Projects") return p.category === activeTab;
    return p.status === activeTab;
  });

  // Analytics Math
  const counts = {
    Deployed: projects.filter(p => p.status === 'Deployed').length,
    InProgress: projects.filter(p => p.status === 'In Progress').length,
    Vibecoded: projects.filter(p => p.status === 'Vibecoded').length,
  };
  const totalHours = projects.reduce((acc, curr) => acc + (curr.hoursLogged || 0), 0); 

  const topTechnologies = React.useMemo(() => {
    const techFreq = {};
    projects.forEach(p => {
      if (Array.isArray(p.techStack)) {
        p.techStack.forEach(t => {
          techFreq[t] = (techFreq[t] || 0) + 1;
        });
      }
    });
    return Object.keys(techFreq).sort((a, b) => techFreq[b] - techFreq[a]).slice(0, 4);
  }, [projects]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!user) return;
    const techArray = newProject.techStack.split(',').map(t => t.trim()).filter(Boolean);
    
    const { data } = await supabase.from('projects').insert([{
      user_id: user.id,
      title: newProject.title,
      description: newProject.description,
      status: newProject.status,
      category: newProject.category,
      tech_stack: techArray,
      progress: 0,
      github_url: newProject.githubUrl || null,
      demo_url: newProject.demoUrl || null,
      hours_logged: 0
    }]).select();

    if (data && data[0]) {
      const p = data[0];
      const insertedProj = {
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          category: p.category,
          techStack: p.tech_stack || [],
          progress: p.progress,
          githubUrl: p.github_url,
          demoUrl: p.demo_url,
          hoursLogged: Number(p.hours_logged)
      };
      setProjects([insertedProj, ...projects]);
      setIsAddProjectOpen(false);
      setNewProject({ title: '', description: '', status: 'In Progress', category: 'Self Made', techStack: '', githubUrl: '', demoUrl: '', hoursLogged: 0 });
    }
  };

  // --- TIME LOGGING SYSTEM STATE ---
  /* 
   * BACKEND INTEGRATION ARCHITECTURE NOTE:
   * 
   * Active Logging Sessions must perfectly sync with the user's backend profile 
   * (e.g., PostgreSQL + Redis KV store) so checking out works across devices or hard-reloads.
   * 
   * Schema:
   * Table: time_logs
   * - id: UUID (Primary Key)
   * - user_id: UUID (Foreign Key -> users.id)
   * - project_id: UUID (Foreign Key -> projects.id)
   * - start_time: TIMESTAMP WITH TIME ZONE
   * - end_time: TIMESTAMP WITH TIME ZONE (Nullable - null means active session)
   * - duration_hours: NUMERIC(5,2) (Calculated on checkout)
   * 
   * API Endpoints required:
   * 1. POST /api/v1/time-logs/check-in -> Set active session payload.
   * 2. POST /api/v1/time-logs/check-out -> Computes duration, updates projects.total_hours, returns summary.
   * 3. GET /api/v1/time-logs/active -> Fetch current active session on mount globally.
   */
  const [activeSession, setActiveSession] = useState(null); // { projectId, startTime }
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInProjectId, setCheckInProjectId] = useState(MOCK_PROJECTS[0]?.id || '');

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInProjectId || !user) return;
    
    const startTime = new Date();
    const { data } = await supabase.from('time_logs').insert([{
      user_id: user.id,
      project_id: checkInProjectId,
      start_time: startTime.toISOString()
    }]).select();

    if (data && data[0]) {
      setActiveSession({
        logId: data[0].id,
        projectId: checkInProjectId,
        startTime: startTime
      });
      setIsCheckInModalOpen(false);
    } else {
      setActiveSession({
        projectId: checkInProjectId,
        startTime: startTime
      });
      setIsCheckInModalOpen(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession) return;
    
    const endTime = new Date();
    const durationMs = endTime - activeSession.startTime;
    const durationHours = Math.max(0.01, durationMs / (1000 * 60 * 60)).toFixed(2);
    
    let targetProject = null;
    let newTotal = 0;
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeSession.projectId || p.id === activeSession.projectId.toString()) {
        newTotal = p.hoursLogged + parseFloat(durationHours);
        targetProject = { ...p, hoursLogged: newTotal };
        return targetProject;
      }
      return p;
    }));
    
    if (activeSession.logId && user) {
      await supabase.from('time_logs').update({
        end_time: endTime.toISOString(),
        duration_hours: parseFloat(durationHours)
      }).eq('id', activeSession.logId).eq('user_id', user.id);
      
      // Update the projects table hours_logged mathematically
      if (targetProject) {
        await supabase.from('projects').update({
           hours_logged: parseFloat(newTotal.toFixed(2))
        }).eq('id', activeSession.projectId).eq('user_id', user.id);
      }
    }
    
    // Redundant targetProject block removed
    
    setActiveSession(null);
  };


  // Terminal effect for "Analyze Project AI"
  useEffect(() => {
    if (isAnalyzing) {
      const lines = [
        "> INITIALIZING NEURAL UPLINK...",
        "> SCANNING REPOSITORY SIGNATURES...",
        "> ANALYZING DEPENDENCY GRAPH [React, Python, ML]...",
        "> DETECTING ARCHITECTURAL PATTERNS...",
        "> CALCULATING CODE COMPLEXITY...",
        "> SUCCESS: INSIGHTS GENERATED."
      ];
      setTerminalLines([]);
      let i = 0;
      const interval = setInterval(() => {
        if (i < lines.length) {
          setTerminalLines(prev => [...prev, lines[i]]);
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setIsAnalyzing(false), 1000); // 1s pause before showing real data
        }
      }, 400); // speed of terminal
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // Main Dashboard List View
  const renderListView = () => (
    <div className="flex flex-col xl:flex-row gap-6 w-full h-full">
      {/* Left Column: Projects List */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Add New Project Card */}
        <motion.div 
          onClick={() => setIsAddProjectOpen(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full bg-card rounded-[2rem] border-[4px] border-dashed border-primary/40 flex items-center justify-center py-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <div className="flex items-center gap-3 text-primary/60 group-hover:text-primary transition-colors">
            <Plus size={32} strokeWidth={3} />
            <span className="font-black text-2xl tracking-tight">Add New Project</span>
          </div>
        </motion.div>

        {/* Project Cards */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedProject(project)}
              >
                <Card className="bg-card cursor-pointer group rounded-[2rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-1 transition-all">
                  <CardContent className="p-6">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black tracking-tight text-primary">
                          {project.title}
                        </h2>
                        <Badge className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-[2px] ${getStatusColor(project.status)}`}>
                          [{project.status}]
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        {project.githubUrl && (
                          <Button size="sm" variant="outline" className="h-8 rounded-full border-[2px] border-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs" onClick={(e) => e.stopPropagation()}>
                            <Github size={14} className="mr-1" /> Github
                          </Button>
                        )}
                        {project.demoUrl && (
                          <Button size="sm" className="h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/20" onClick={(e) => e.stopPropagation()}>
                            <ExternalLink size={14} className="mr-1" /> Demo
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-primary/70 font-semibold text-sm mb-6 max-w-2xl leading-relaxed">
                      {project.description}
                    </p>

                    {/* Bottom Row: Tech Stack & Progress */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
                      <div className="flex flex-wrap gap-3">
                        {project.techStack.map(tech => {
                          const tData = getTechData(tech);
                          return (
                            <a key={tech} href={tData.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-background border-[2px] border-primary rounded-[0.8rem] text-primary font-bold text-xs tracking-tight shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 pointer-events-auto">
                              {tData.icon ? (
                                <img src={tData.icon} alt={tech} className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tech)}&background=random&color=fff&rounded=true&bold=true`; }} />
                              ) : (
                                <Cpu size={14} className="text-primary" />
                              )}
                              {tech}
                            </a>
                          );
                        })}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Analytics Sidebar */}
      <div className="w-full lg:w-[30%] xl:w-[25%] 2xl:w-[22%] shrink-0 flex flex-col gap-6 lg:sticky lg:top-28 h-fit">
        
        {/* Pie Chart Widget */}
        <Card className="bg-card rounded-[2rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/10">
          <CardContent className="p-6">
            <h3 className="font-black text-xl text-primary tracking-tight mb-6">Count by Status</h3>
            <div className="flex justify-center mb-8">
              {/* Custom CSS Conic Gradient Donut Chart */}
              <motion.div 
                initial={{ rotate: -90, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="relative flex items-center justify-center w-32 h-32 rounded-full border-[4px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/20"
                style={{
                  background: `conic-gradient(
                    #27005D 0deg ${(counts.Deployed/(counts.Deployed + counts.InProgress + counts.Vibecoded))*360}deg, 
                    #9400FF ${(counts.Deployed/(counts.Deployed + counts.InProgress + counts.Vibecoded))*360}deg ${((counts.Deployed + counts.InProgress)/(counts.Deployed + counts.InProgress + counts.Vibecoded))*360}deg, 
                    #AED2FF ${((counts.Deployed + counts.InProgress)/(counts.Deployed + counts.InProgress + counts.Vibecoded))*360}deg 360deg
                  )`
                }}
              >
                {/* Inner Donut Hole */}
                <div className="w-16 h-16 bg-card rounded-full border-[4px] border-primary" />
              </motion.div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-md border-[2px] border-primary bg-[#27005D]" />
                <span className="font-bold text-sm text-primary flex-1">Deployed</span>
                <span className="font-black text-primary">{counts.Deployed}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-md border-[2px] border-primary bg-[#9400FF]" />
                <span className="font-bold text-sm text-primary flex-1">In Progress</span>
                <span className="font-black text-primary">{counts.InProgress}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-md border-[2px] border-primary bg-[#AED2FF]" />
                <span className="font-bold text-sm text-primary flex-1">Vibecoded</span>
                <span className="font-black text-primary">{counts.Vibecoded}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Hours Widget */}
        <Card className="bg-card rounded-[2rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/10 text-center flex flex-col items-center">
          <CardContent className="p-6 w-full flex flex-col items-center">
            <h3 className="font-black text-lg text-primary tracking-tight mb-2">Total Hours Logged</h3>
            <div className={`font-handwriting text-5xl text-secondary mt-2 w-full ${activeSession ? 'mb-4' : ''}`}>
              {totalHours.toFixed(1)} hrs
            </div>
            
            {activeSession ? (
               <div className="w-full bg-primary/5 border-[3px] border-primary/20 rounded-2xl p-4 flex flex-col items-center gap-3">
                 <div className="flex items-center justify-center w-full gap-2 text-primary font-bold text-xs md:text-sm bg-primary/10 px-3 py-2 rounded-full relative shadow-inner">
                   <div className="absolute top-1/2 -translate-y-1/2 left-3 w-2.5 h-2.5 rounded-full bg-destructive animate-ping"></div>
                   <div className="absolute top-1/2 -translate-y-1/2 left-3 w-2.5 h-2.5 rounded-full bg-destructive"></div>
                   <span className="truncate max-w-[80%] pl-4 text-center">Logging: {projects.find(p => p.id === activeSession.projectId)?.title}</span>
                 </div>
                 <div className="text-[10px] md:text-xs font-black text-primary/50 uppercase tracking-widest mt-1">
                   Started at {activeSession.startTime.toLocaleTimeString()}
                 </div>
                 <Button onClick={handleCheckOut} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-[1rem] py-5 border-[3px] border-destructive shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-destructive/20 font-black tracking-widest uppercase mt-1 hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all z-10 overflow-hidden active:scale-95">
                   CHECK OUT
                 </Button>
               </div>
            ) : (
               <Button onClick={() => setIsCheckInModalOpen(true)} className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[1rem] py-6 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/20 font-black tracking-widest uppercase hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all z-10 active:scale-95">
                 <Clock className="mr-2" size={20} strokeWidth={3} /> CREATE A LOG
               </Button>
            )}
          </CardContent>
        </Card>

        {/* Top Tech Widget */}
        <Card className="bg-card rounded-[2rem] border-[4px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/10">
          <CardContent className="p-6">
            <h3 className="font-black text-lg text-primary tracking-tight mb-4">Top Technologies</h3>
            <div className="flex flex-col gap-3 mt-4">
              {topTechnologies.length > 0 ? (
                topTechnologies.map((tech, i) => {
                  const searchTech = tech === 'AI/ML' ? 'AI' : tech;
                  const tData = getTechData(searchTech);
                  return (
                    <a key={tech} href={tData.url} target="_blank" rel="noopener noreferrer" className="flex items-stretch px-4 py-3 bg-background border-[2px] border-primary rounded-xl shadow-[3px_3px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1 group">
                      <div className="flex items-center gap-3 w-full">
                        <span className="font-black text-primary/40 w-4 text-sm group-hover:text-primary transition-colors">{i + 1}.</span>
                        {tData.icon ? (
                          <img src={tData.icon} alt={tech} className="w-5 h-5 object-contain group-hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tech)}&background=random&color=fff&rounded=true&bold=true`; }} />
                        ) : (
                          <Cpu size={20} className="text-primary group-hover:scale-110 transition-transform" />
                        )}
                        <span className="font-black tracking-tight text-primary text-sm">{tech}</span>
                      </div>
                    </a>
                  );
                })
              ) : (
                <div className="py-6 text-center text-primary/40 font-bold uppercase tracking-widest text-sm border-2 border-dashed border-primary/20 rounded-xl">
                  No Technologies Used
                </div>
              )}
            </div>
          </CardContent>
        </Card>



      </div>
    </div>
  );

  // Detailed Project View
  const renderDetailView = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 w-full h-full"
    >
      {/* Top Banner specific to Detail View */}
      <div className="flex justify-start mb-6 w-full">
        <Button 
          onClick={() => {
            setSelectedProject(null);
            setIsAnalyzing(false);
          }}
          className="bg-card border-[3px] border-primary text-primary hover:bg-primary hover:text-primary-foreground font-black uppercase tracking-widest rounded-full shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/20"
        >
          <ChevronLeft className="mr-2" size={20} /> Back to Projects
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Analyze Hero Card */}
        <motion.div 
          layoutId={`card-${selectedProject.id}`}
          onClick={() => setIsAnalyzing(true)}
          className={`relative bg-foreground rounded-[2.5rem] border-[4px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-secondary flex flex-col items-center justify-center min-h-[300px] cursor-pointer overflow-hidden group ${isAnalyzing ? 'cursor-default' : ''}`}
        >
          <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors"></div>
          
          {isAnalyzing ? (
            <div className="p-8 w-full h-full flex flex-col justify-start relative z-10 font-mono text-sm sm:text-base">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="text-secondary animate-pulse" size={24} />
                <span className="text-secondary font-bold tracking-widest">AIM_SYS_ACTIVE</span>
              </div>
              <div className="space-y-2 text-primary-foreground/80">
                {terminalLines.map((line, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
              {terminalLines.length === 6 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 text-secondary font-black text-xl tracking-tight bg-secondary/20 p-4 border-l-4 border-secondary"
                >
                  <Cpu className="inline mr-2 mb-1" /> ARCHITECTURE RATING: 98% (OPTIMAL)
                </motion.div>
              )}
            </div>
          ) : (
            <CardContent className="h-full flex flex-col items-center justify-center text-center p-12 relative z-10">
              <Terminal size={64} className="text-secondary mb-6 group-hover:scale-110 transition-transform duration-500" />
              <h2 className="text-3xl sm:text-5xl font-black text-primary-foreground tracking-tighter uppercase mb-4">
                Analyze Project AI
              </h2>
              <p className="text-primary-foreground/60 font-medium tracking-wide">
                Click to initiate deep-scan of repository architecture and performance metrics.
              </p>
            </CardContent>
          )}
        </motion.div>

        {/* Top Right Card Placeholder */}
        <Card className="bg-card rounded-[2.5rem] border-[4px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary/10 p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-[1rem] border-[3px] border-secondary/30 group-hover:bg-secondary/20 transition-colors shadow-inner">
                <Activity className="text-secondary group-hover:animate-pulse" size={32} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black text-primary tracking-tight uppercase">Project Health</h3>
            </div>
            
            <div className="px-4 py-2 bg-background border-[3px] border-primary/20 rounded-full flex items-center gap-2 shadow-[2px_2px_0px_var(--tw-shadow-color)] shadow-primary/10 w-fit cursor-default">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-bold text-xs uppercase tracking-widest text-primary">Online</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-2 bg-background border-[4px] border-primary rounded-[2rem] p-6 shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:-translate-y-1 hover:shadow-primary/40 transition-all cursor-default w-full">
            <span className="text-sm font-black text-primary/50 uppercase tracking-widest block">Total Time Invested</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-handwriting text-6xl text-primary drop-shadow-sm">{selectedProject.hoursLogged || 0}</span>
              <span className="font-black text-lg text-primary/80 uppercase tracking-widest">Hours Spent</span>
            </div>
          </div>
        </Card>

        {/* Description & Tech Stack Card */}
        <Card className="bg-card rounded-[2.5rem] border-[4px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary/10 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-4xl font-black text-primary tracking-tighter mb-4 uppercase">{selectedProject.title}</h3>
            <p className="text-primary/80 font-bold text-lg mb-8 leading-relaxed">
              {selectedProject.description}
            </p>
          </div>
          <div>
            <span className="text-sm font-black text-primary/40 uppercase tracking-widest block mb-3">Tech Stack Logos</span>
            <div className="flex flex-wrap gap-4">
              {selectedProject.techStack.map(tech => {
                const tData = getTechData(tech);
                return (
                  <a key={tech} href={tData.url} target="_blank" rel="noopener noreferrer" className="px-5 py-3 bg-background border-[3px] border-primary rounded-2xl flex items-center justify-center gap-3 font-black text-primary tracking-tight shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all group">
                    {tData.icon ? (
                      <img src={tData.icon} alt={tech} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tech)}&background=random&color=fff&rounded=true&bold=true`; }} />
                    ) : (
                      <Cpu size={24} className="text-primary group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-lg">{tech}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Links Card */}
        <Card className="bg-card rounded-[2.5rem] border-[4px] border-primary shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary/10 p-8 flex flex-col justify-center gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
          
          <h3 className="text-2xl font-black text-primary tracking-tight uppercase relative z-10 flex items-center gap-3">
             <ExternalLink className="text-secondary" /> Project Links
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-5 relative z-10">
            <motion.a 
              href={selectedProject.githubUrl || "#"}
              target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -4, rotate: -1 }}
              whileTap={{ scale: 0.98, y: 0 }}
              className="flex-1 flex items-center justify-center bg-foreground text-primary-foreground h-[72px] rounded-[1.5rem] border-[4px] border-primary font-black text-xl shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:shadow-none transition-shadow hover:bg-foreground/90"
            >
              <Github className="mr-3" size={28} /> GIT REPO
            </motion.a>
            
            {selectedProject.demoUrl ? (
              <motion.a 
                href={selectedProject.demoUrl}
                target="_blank" rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -4, rotate: 1 }}
                whileTap={{ scale: 0.98, y: 0 }}
                className="flex-1 flex items-center justify-center bg-secondary text-primary-foreground h-[72px] rounded-[1.5rem] border-[4px] border-primary font-black text-xl shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/20 hover:shadow-none transition-shadow hover:bg-secondary/90 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out"></div>
                <ExternalLink className="mr-3" size={28} /> LIVE DEMO
              </motion.a>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-muted/50 text-primary/40 h-[72px] rounded-[1.5rem] border-[4px] border-primary/20 font-black text-xl border-dashed">
                NO DEMO AVAILABLE
              </div>
            )}
          </div>
        </Card>

        {/* Bottom Banner */}
        <div className="lg:col-span-2 text-center mt-4">
          <span className="font-handwriting text-3xl text-primary opacity-60">
            "Architecture dictates destiny."
          </span>
        </div>

      </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full flex flex-col pt-6 px-4 xl:pt-8 xl:px-6 pb-20 xl:pb-0 relative z-10">
      
      {/* Top Navigation Tabs - Framer Motion & Shadcn UI */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md pt-4 pb-6 -mx-4 px-4 lg:-mx-6 xl:px-6 mb-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-8 py-3.5 rounded-[1.5rem] border-[3px] font-black tracking-widest uppercase transition-all duration-300 outline-none z-10
                ${activeTab === tab 
                  ? 'text-primary-foreground border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary/20 scale-[1.02]' 
                  : 'bg-card border-primary/20 text-primary hover:border-primary hover:bg-primary/5 hover:scale-[1.02]'
                }`}
            >
              {/* Framer Motion Active Tab Indicator */}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabHighlight"
                  className="absolute inset-x-0 inset-y-0 bg-primary rounded-[1.2rem] -z-10 m-[2px]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-20">{tab}</span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
      </div>

      {/* Dynamic Content Rendering */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedProject ? 'detail' : 'list'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {selectedProject ? renderDetailView() : renderListView()}
        </motion.div>
      </AnimatePresence>

      {/* ADD PROJECT MODAL */}
      <AnimatePresence>
        {isAddProjectOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-2xl rounded-[2.5rem] border-[4px] border-primary shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <Button onClick={() => setIsAddProjectOpen(false)} variant="outline" className="absolute top-6 right-6 rounded-[1rem] w-12 h-12 p-0 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-destructive hover:text-destructive-foreground hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all z-10">
                <X size={24} strokeWidth={3} />
              </Button>
              
              <h2 className="text-3xl font-black text-primary tracking-tight pr-12 mb-6">New Project</h2>
              
              <form onSubmit={handleAddProject} className="flex flex-col gap-6">
                
                {/* Title & Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Project Title</label>
                  <input 
                    type="text" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})}
                    placeholder="E.g. NeuroFinance Workflow" required
                    className="w-full bg-background border-[3px] border-primary rounded-[1rem] px-4 py-3 font-bold text-primary focus:outline-none focus:ring-4 ring-primary/20 transition-all" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Description</label>
                  <textarea 
                    value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Briefly describe what it does..." required rows={3}
                    className="w-full bg-background border-[3px] border-primary rounded-[1rem] px-4 py-3 font-bold text-primary focus:outline-none focus:ring-4 ring-primary/20 transition-all resize-none" 
                  />
                </div>

                {/* Categories & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Status</label>
                    <select 
                      value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}
                      className="w-full bg-background border-[3px] border-primary rounded-[1rem] px-4 py-3 font-bold text-primary focus:outline-none focus:ring-4 ring-primary/20 transition-all"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Deployed">Deployed</option>
                      <option value="Vibecoded">Vibecoded</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Category</label>
                    <select 
                      value={newProject.category} onChange={e => setNewProject({...newProject, category: e.target.value})}
                      className="w-full bg-background border-[3px] border-primary rounded-[1rem] px-4 py-3 font-bold text-primary focus:outline-none focus:ring-4 ring-primary/20 transition-all"
                    >
                      <option value="Self Made">Self Made</option>
                      <option value="Team Projects">Team Projects</option>
                    </select>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Tech Stack (comma separated)</label>
                  <input 
                    type="text" value={newProject.techStack} onChange={e => setNewProject({...newProject, techStack: e.target.value})}
                    placeholder="React, Python, Tailwind" required
                    className="w-full bg-background border-[3px] border-primary rounded-[1rem] px-4 py-3 font-bold text-primary focus:outline-none focus:ring-4 ring-primary/20 transition-all" 
                  />
                </div>

                {/* Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">GitHub URL</label>
                    <input 
                      type="url" value={newProject.githubUrl} onChange={e => setNewProject({...newProject, githubUrl: e.target.value})}
                      placeholder="https://github.com/..." 
                      className="w-full bg-background border-[3px] border-primary rounded-[1rem] px-4 py-3 font-bold text-primary focus:outline-none focus:ring-4 ring-primary/20 transition-all" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Live Demo URL</label>
                    <input 
                      type="url" value={newProject.demoUrl} onChange={e => setNewProject({...newProject, demoUrl: e.target.value})}
                      placeholder="https://..." 
                      className="w-full bg-background border-[3px] border-primary rounded-[1rem] px-4 py-3 font-bold text-primary focus:outline-none focus:ring-4 ring-primary/20 transition-all" 
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2 bg-primary text-primary-foreground rounded-[1rem] py-6 border-[3px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-primary/90 transition-all font-black text-xl tracking-wider active:translate-y-1 active:translate-x-1 active:shadow-none">
                  PUBLISH PROJECT
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECK IN MODAL */}
      <AnimatePresence>
        {isCheckInModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-lg rounded-[2.5rem] border-[4px] border-primary shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-primary p-8 relative flex flex-col"
            >
              <Button onClick={() => setIsCheckInModalOpen(false)} variant="outline" className="absolute top-6 right-6 rounded-[1rem] w-12 h-12 p-0 border-[3px] border-primary shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-destructive hover:text-destructive-foreground hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all z-10">
                <X size={24} strokeWidth={3} />
              </Button>
              
              <h2 className="text-3xl font-black text-primary tracking-tight pr-12 mb-6 uppercase">Create Log</h2>
              
              <form onSubmit={handleCheckIn} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold opacity-70 uppercase tracking-widest text-primary">Select Project to Log</label>
                  <Select value={checkInProjectId.toString()} onValueChange={setCheckInProjectId} required>
                    <SelectTrigger className="w-full h-auto bg-background border-[3px] border-primary rounded-[1rem] px-4 py-4 font-bold text-primary focus:outline-none focus:ring-4 ring-primary/20 transition-all text-lg shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-primary hover:shadow-none hover:translate-y-1 hover:translate-x-1 outline-none">
                      <SelectValue placeholder="-- Choose a Project --" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-[3px] border-primary rounded-[1rem] shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary overflow-hidden z-[200]">
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()} className="font-bold text-primary text-base cursor-pointer focus:bg-primary/5 py-3 rounded-lg">
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-primary/5 border-[2px] border-primary/20 rounded-2xl p-4 mt-2">
                  <p className="text-xs font-bold text-primary/60 leading-relaxed">
                    By clicking <strong>START SESSION</strong>, your local time block will be recorded. Once you check out, the duration will automatically append to the project's total hours.
                  </p>
                </div>

                <Button type="submit" className="w-full mt-2 bg-primary text-primary-foreground rounded-[1rem] py-6 border-[3px] border-primary shadow-[6px_6px_0px_var(--tw-shadow-color)] shadow-primary hover:bg-primary/90 transition-all font-black text-xl tracking-wider active:translate-y-1 active:translate-x-1 active:shadow-none">
                  START SESSION
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
