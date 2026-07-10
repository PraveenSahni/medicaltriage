import React, { useState, useMemo } from 'react';
import { COMPREHENSIVE_SKILLS } from '../data/consoleData';
import { Search, ChevronRight, X, ChevronDown, CheckCircle, BookOpen, Target, LayoutDashboard, Compass, Layers } from 'lucide-react';
import { Skill } from '../types/console';
import { SkillDrawer } from '../components/skills/SkillDrawer';
import { GuidedPath } from '../components/skills/GuidedPath';

export const SkillsConsole: React.FC = () => {
  const [activeView, setActiveView] = useState<'browse' | 'path'>('browse');
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('cluster');

  // Selected Skill for Drawer
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Derived Data
  const clusters = useMemo(() => {
    const counts: Record<string, number> = {};
    COMPREHENSIVE_SKILLS.forEach(s => {
      counts[s.c] = (counts[s.c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const filteredSkills = useMemo(() => {
    let result = [...COMPREHENSIVE_SKILLS];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.n.toLowerCase().includes(q) || 
        s.c.toLowerCase().includes(q) || 
        (s.w && s.w.toLowerCase().includes(q))
      );
    }
    
    if (selectedCluster !== 'all') {
      result = result.filter(s => s.c === selectedCluster);
    }
    
    if (availabilityFilter !== 'all') {
      result = result.filter(s => {
        if (s.u == null) return false;
        if (availabilityFilter === 'scarce') return s.u < 30;
        if (availabilityFilter === 'mid') return s.u >= 30 && s.u <= 60;
        return s.u > 60;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'cluster') {
        const cCmp = a.c.localeCompare(b.c);
        return cCmp !== 0 ? cCmp : a.n.localeCompare(b.n);
      }
      if (sortBy === 'name') return a.n.localeCompare(b.n);
      if (sortBy === 'scarce') return (a.u ?? 999) - (b.u ?? 999);
      if (sortBy === 'demand') return (a.d ?? 999) - (b.d ?? 999);
      return 0;
    });

    return result;
  }, [searchQuery, selectedCluster, availabilityFilter, sortBy]);

  const avgU = Math.round(COMPREHENSIVE_SKILLS.reduce((acc, s) => acc + (s.u || 0), 0) / COMPREHENSIVE_SKILLS.length);
  const scarceCount = COMPREHENSIVE_SKILLS.filter(s => (s.u || 0) < 30).length;

  return (
    <div className="min-h-screen bg-ist-cream pt-24 pb-12 font-sans relative">
      
      {/* Welcome Overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ist-cream/95 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="max-w-4xl w-full text-center animate-fade-in-up">
            <h4 className="text-ist-gold font-bold tracking-widest uppercase text-sm mb-4">IRISSTAR · Enterprise AI · UAE Engagement</h4>
            <h2 className="text-4xl md:text-5xl font-extrabold text-ist-blue mb-6">Welcome to the Console</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-12 text-lg">
              A map of Enterprise AI skills with UAE talent signals and free, open routes to learn and prove each one. Where would you like to begin?
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
              <button onClick={() => { setShowWelcome(false); setActiveView('browse'); }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-ist-gold hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-ist-gold text-left">
                <div className="w-12 h-12 bg-ist-blue text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6 shadow-sm group-hover:bg-ist-gold transition-colors">01</div>
                <h3 className="text-xl font-bold text-ist-blue mb-2">Explore the catalogue</h3>
                <p className="text-gray-500 text-sm mb-6">Search and filter all skills with live talent-supply gauges.</p>
                <span className="text-ist-gold font-bold text-sm uppercase tracking-wider group-hover:underline">Open console →</span>
              </button>
              
              <button onClick={() => { setShowWelcome(false); setActiveView('path'); }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-ist-gold hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-ist-gold text-left">
                <div className="w-12 h-12 bg-ist-blue text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6 shadow-sm group-hover:bg-ist-gold transition-colors">02</div>
                <h3 className="text-xl font-bold text-ist-blue mb-2">Guide me to a path</h3>
                <p className="text-gray-500 text-sm mb-6">Pick a track and a target level, then walk a clickable roadmap.</p>
                <span className="text-ist-gold font-bold text-sm uppercase tracking-wider group-hover:underline">Start a path →</span>
              </button>
              
              <button 
                onClick={() => { 
                  setShowWelcome(false); 
                  setActiveView('browse');
                  setAvailabilityFilter('scarce');
                  setSortBy('scarce');
                  setSelectedCluster('all');
                }} 
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-ist-gold hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-ist-gold text-left"
              >
                <div className="w-12 h-12 bg-ist-blue text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6 shadow-sm group-hover:bg-ist-gold transition-colors">03</div>
                <h3 className="text-xl font-bold text-ist-blue mb-2">Scarcest UAE skills</h3>
                <p className="text-gray-500 text-sm mb-6">Jump to the skills hardest to source locally — high leverage.</p>
                <span className="text-ist-gold font-bold text-sm uppercase tracking-wider group-hover:underline">Show me →</span>
              </button>
            </div>
            
            <button onClick={() => setShowWelcome(false)} className="text-gray-500 text-sm uppercase tracking-widest font-bold hover:text-ist-blue transition-colors">
              Skip — just show everything
            </button>
          </div>
        </div>
      )}

      {/* Main Header / Masthead */}
      <div className="bg-white border-b border-gray-200 py-6 px-6 lg:px-12 sticky top-20 z-30 shadow-sm animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="cursor-pointer" onClick={() => setShowWelcome(true)}>
              <span className="text-ist-gold text-xs font-bold uppercase tracking-widest block mb-1">UAE Talent & Learning Navigator</span>
              <h1 className="text-2xl font-extrabold text-ist-blue">Enterprise AI Skills Console</h1>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveView('browse')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeView === 'browse' ? 'bg-ist-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Compass className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                Explore
              </button>
              <button 
                onClick={() => setActiveView('path')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeView === 'path' ? 'bg-ist-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Target className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                Guided Paths
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-8 md:gap-16 pt-4 border-t border-gray-100">
            <div>
              <div className="text-3xl font-extrabold text-ist-blue">{COMPREHENSIVE_SKILLS.length}</div>
              <div className="text-xs uppercase tracking-widest font-bold text-gray-400 mt-1">Skills Catalogued</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-ist-blue">{clusters.length}</div>
              <div className="text-xs uppercase tracking-widest font-bold text-gray-400 mt-1">Skill Clusters</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-ist-blue">{avgU}<span className="text-base text-gray-400 font-normal ml-1">/100</span></div>
              <div className="text-xs uppercase tracking-widest font-bold text-gray-400 mt-1">Avg UAE Availability</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-ist-gold">{scarceCount}</div>
              <div className="text-xs uppercase tracking-widest font-bold text-gray-400 mt-1">Scarce in UAE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-8 flex flex-col md:flex-row gap-8 items-start">
        
        {activeView === 'browse' && (
          <>
            {/* Sidebar Rail */}
            <aside className="w-full md:w-72 flex-shrink-0 sticky top-56 space-y-8 animate-fade-in-left">
              <div>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search skills..." 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ist-gold focus:border-ist-gold text-sm shadow-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Availability</h3>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-ist-gold text-sm shadow-sm cursor-pointer"
                    value={availabilityFilter}
                    onChange={e => setAvailabilityFilter(e.target.value)}
                  >
                    <option value="all">All supply levels</option>
                    <option value="scarce">Scarce in UAE (&lt; 30)</option>
                    <option value="mid">Moderate UAE (30-60)</option>
                    <option value="strong">Strong UAE (&gt; 60)</option>
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Skill Clusters</h3>
                <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto pr-2">
                  <button 
                    onClick={() => setSelectedCluster('all')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${selectedCluster === 'all' ? 'bg-ist-blue text-white font-medium shadow-sm' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <span>All clusters</span>
                    <span className={`text-xs ${selectedCluster === 'all' ? 'text-white/80' : 'text-gray-400'}`}>{COMPREHENSIVE_SKILLS.length}</span>
                  </button>
                  {clusters.map(([cluster, count]) => (
                    <button 
                      key={cluster}
                      onClick={() => setSelectedCluster(cluster)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${selectedCluster === cluster ? 'bg-ist-blue text-white font-medium shadow-sm' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      <span className="truncate pr-2">{cluster}</span>
                      <span className={`text-xs ${selectedCluster === cluster ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/50 p-4 rounded-xl border border-gray-200/60 shadow-sm">
                <div className="text-xs text-gray-600 flex items-center mb-2">
                  <div className="w-3 h-3 rounded-sm bg-ist-blue mr-2"></div>
                  UAE talent availability (0-100)
                </div>
                <div className="text-xs text-gray-600 flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-ist-gold mr-2"></div>
                  India talent availability (0-100)
                </div>
              </div>
            </aside>

            {/* Grid Area */}
            <div className="flex-1 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="text-sm text-gray-500 font-medium">
                  Showing <strong className="text-ist-blue">{filteredSkills.length}</strong> skills
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Sort</label>
                  <select 
                    className="bg-transparent border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-ist-gold text-sm shadow-sm cursor-pointer"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="cluster">Cluster, A→Z</option>
                    <option value="name">Skill name, A→Z</option>
                    <option value="scarce">Scarcest in UAE first</option>
                    <option value="demand">Highest demand gap first</option>
                  </select>
                </div>
              </div>

              {filteredSkills.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredSkills.map((skill, idx) => (
                    <button 
                      key={`${skill.c}-${skill.n}-${idx}`}
                      onClick={() => setSelectedSkill(skill)}
                      className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-ist-gold hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-ist-gold group flex flex-col h-full"
                    >
                      <div className="text-[10px] font-bold tracking-widest uppercase text-ist-gold mb-2 truncate">
                        {skill.c}
                      </div>
                      <h3 className="text-lg font-bold text-ist-blue mb-3 leading-tight group-hover:text-ist-gold transition-colors">
                        {skill.n}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">
                        {skill.w || 'Skill in the Enterprise AI taxonomy.'}
                      </p>
                      
                      <div className="space-y-3 mt-auto">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-400 tracking-wider w-8">UAE</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-ist-blue rounded-full" style={{ width: `${skill.u || 0}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-6 text-right">{skill.u || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-400 tracking-wider w-8">IND</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-ist-gold rounded-full" style={{ width: `${skill.i || 0}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-6 text-right">{skill.i || '-'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
                          {skill.d != null ? (
                            <>
                              <span className={skill.d > 0 ? 'text-green-600' : skill.d < 0 ? 'text-red-500' : 'text-gray-400'}>
                                {skill.d > 0 ? '+' : ''}{skill.d}
                              </span>
                              <span className="text-[9px] uppercase tracking-widest text-gray-400">Gap</span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-ist-blue group-hover:text-ist-gold flex items-center gap-1">
                          Details <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-ist-blue mb-2">No skills found</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Try adjusting your search terms or clearing your filters to see more results.
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCluster('all'); setAvailabilityFilter('all'); }}
                    className="mt-6 px-6 py-2 bg-ist-blue text-white text-sm font-bold rounded-full hover:bg-ist-gold transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'path' && (
          <GuidedPath onSelectSkill={setSelectedSkill} />
        )}

      </div>

      {/* Drawer */}
      <SkillDrawer 
        skill={selectedSkill} 
        onClose={() => setSelectedSkill(null)} 
      />
      
    </div>
  );
};
