import React, { useState, useMemo } from 'react';
import { COMPREHENSIVE_SKILLS, PROFICIENCY_DATA } from '../../data/consoleData';
import { ChevronRight, ArrowLeft, Target, BookOpen, CheckCircle, Brain, Server, ShieldCheck, Cog, Cloud, Network, Bot, Settings, Layers } from 'lucide-react';
import { Skill } from '../../types/console';

interface Family {
  id: string;
  t: string;
  d: string;
  icon: React.FC<{ className?: string }>;
  m: (s: string) => boolean;
}

const FAMILIES: Family[] = [
  { id: 'arch', t: 'Architecture & Solutioning', d: 'Solution & technical architecture tracks', icon: Server, m: s => /architect|solution/i.test(s) },
  { id: 'genai', t: 'GenAI & Agentic Dev', d: 'Generative & agentic application engineering', icon: Brain, m: s => /genai|generative|agentic|prompt|\bllm\b|rag/i.test(s) },
  { id: 'mlops', t: 'MLOps & DevOps', d: 'Model ops, pipelines, SRE & IaC', icon: Cog, m: s => /mlops|devops/i.test(s) },
  { id: 'ds', t: 'Data Science & ML', d: 'ML, deep learning, statistics & data', icon: Network, m: s => /data science|machine learning|ml engineering|statistic|pyspark|snowflake|databricks|dataiku|datarobot|nvidia|computer vision|\bnlp\b/i.test(s) },
  { id: 'cloud', t: 'Cloud AI Services', d: 'AWS, Azure & GCP managed AI services', icon: Cloud, m: s => /ai services|cognitive|watsonx|bedrock|vertex|gemini/i.test(s) },
  { id: 'auto', t: 'Intelligent Automation', d: 'RPA & process automation platforms', icon: Bot, m: s => /automation/i.test(s) },
  { id: 'assure', t: 'AI Assurance & Responsible AI', d: 'Quality, trust, ethics & evaluation', icon: ShieldCheck, m: s => /assurance|trust|responsible|ethical|legal|governance|quality|test|performance|evaluation/i.test(s) },
  { id: 'platform', t: 'Platform & Integration', d: 'Backend, frontend, integration & data platforms', icon: Layers, m: s => /integration|platform|kafka|java|node|\.net|frontend|backend|fullstack|mainframe|data-engg|data engineering/i.test(s) },
  { id: 'other', t: 'Other tracks', d: 'Remaining specialised clusters', icon: Settings, m: s => true },
];

export const GuidedPath: React.FC<{
  onSelectSkill: (skill: Skill) => void;
}> = ({ onSelectSkill }) => {
  const [step, setStep] = useState<'family' | 'cluster' | 'target' | 'roadmap'>('family');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedClusterName, setSelectedClusterName] = useState<string | null>(null);
  const [selectedTargetLevel, setSelectedTargetLevel] = useState<string | null>(null);
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());

  // Derive unique clusters and assign to families
  const familyClusters = useMemo(() => {
    const allClusters = Array.from(new Set(COMPREHENSIVE_SKILLS.map(s => s.c)));
    const mapping: Record<string, string[]> = {};
    FAMILIES.forEach(f => mapping[f.id] = []);
    
    allClusters.forEach(clusterName => {
      for (const fam of FAMILIES) {
        if (fam.id === 'other' || fam.m(clusterName)) {
          mapping[fam.id].push(clusterName);
          break;
        }
      }
    });
    return mapping;
  }, []);

  const selectedFamily = FAMILIES.find(f => f.id === selectedFamilyId);
  const clustersInFamily = selectedFamilyId ? familyClusters[selectedFamilyId] : [];
  
  const skillsInCluster = useMemo(() => {
    if (!selectedClusterName) return [];
    return COMPREHENSIVE_SKILLS.filter(s => s.c === selectedClusterName).sort((a, b) => a.n.localeCompare(b.n));
  }, [selectedClusterName]);

  const toggleSkillCompletion = (skillName: string) => {
    setCompletedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skillName)) next.delete(skillName);
      else next.add(skillName);
      return next;
    });
  };

  const resetPath = () => {
    setStep('family');
    setSelectedFamilyId(null);
    setSelectedClusterName(null);
    setSelectedTargetLevel(null);
    setCompletedSkills(new Set());
  };

  if (step === 'family') {
    return (
      <div className="w-full animate-fade-in">
        <h2 className="text-2xl font-extrabold text-ist-blue mb-2">Choose a track to build toward</h2>
        <p className="text-gray-500 mb-8 max-w-2xl text-sm">Select a high-level discipline family. We have grouped related skill clusters to help you navigate the taxonomy based on your career interests.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FAMILIES.map(fam => {
            const count = familyClusters[fam.id].length;
            if (count === 0 && fam.id === 'other') return null; // hide empty 'other'
            
            const Icon = fam.icon;
            
            return (
              <button 
                key={fam.id}
                disabled={count === 0}
                onClick={() => {
                  setSelectedFamilyId(fam.id);
                  setStep('cluster');
                }}
                className={`text-left p-6 rounded-2xl border transition-all ${count > 0 ? 'bg-white border-gray-200 hover:border-ist-gold hover:shadow-md cursor-pointer group' : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${count > 0 ? 'bg-ist-cream text-ist-gold' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {count > 0 && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{count} {count === 1 ? 'cluster' : 'clusters'}</span>}
                </div>
                <h3 className={`font-bold mb-1 ${count > 0 ? 'text-ist-blue group-hover:text-ist-gold transition-colors' : 'text-gray-500'}`}>{fam.t}</h3>
                <p className="text-xs text-gray-500 leading-relaxed pr-2">{fam.d}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 'cluster' && selectedFamily) {
    return (
      <div className="w-full animate-fade-in">
        <button onClick={() => setStep('family')} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-ist-blue flex items-center mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Families
        </button>
        
        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ist-gold mb-1">{selectedFamily.t}</div>
          <h2 className="text-2xl font-extrabold text-ist-blue mb-2">Select a specific cluster</h2>
          <p className="text-gray-500 max-w-2xl text-sm">Which specific cluster within this family do you want to target?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clustersInFamily.map(cluster => {
            const skillCount = COMPREHENSIVE_SKILLS.filter(s => s.c === cluster).length;
            return (
              <button 
                key={cluster}
                onClick={() => {
                  setSelectedClusterName(cluster);
                  setStep('target');
                }}
                className="bg-white border border-gray-200 p-5 rounded-2xl text-left hover:border-ist-gold hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-ist-blue group-hover:text-ist-gold transition-colors text-lg mb-1">{cluster}</h3>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{skillCount} {skillCount === 1 ? 'skill' : 'skills'}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-ist-gold transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 'target' && selectedClusterName) {
    const levels = [
      { id: 'L1', title: 'Beginner (L1)', desc: 'Foundations and conceptual understanding.' },
      { id: 'L2', title: 'Intermediate (L2)', desc: 'Standard project delivery and practical application.' },
      { id: 'L3', title: 'Advanced (L3)', desc: 'Complex design, optimization, and leadership.' },
      { id: 'L4', title: 'Expert (L4)', desc: 'Strategy, mentoring, and enterprise-wide influence.' },
    ];

    return (
      <div className="w-full animate-fade-in">
        <button onClick={() => setStep('cluster')} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-ist-blue flex items-center mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Clusters
        </button>

        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ist-gold mb-1">{selectedClusterName}</div>
          <h2 className="text-2xl font-extrabold text-ist-blue mb-2">What is your target proficiency?</h2>
          <p className="text-gray-500 max-w-2xl text-sm">To build your roadmap, tell us which level of proficiency you want to achieve.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levels.map(lvl => (
            <button 
              key={lvl.id}
              onClick={() => {
                setSelectedTargetLevel(lvl.id);
                setStep('roadmap');
              }}
              className="bg-white border border-gray-200 p-6 rounded-2xl text-left hover:border-ist-gold hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-ist-cream text-ist-gold flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-ist-gold group-hover:text-white transition-colors">
                {lvl.id}
              </div>
              <div>
                <h3 className="font-bold text-ist-blue group-hover:text-ist-gold transition-colors mb-1">{lvl.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed pr-2">{lvl.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'roadmap' && selectedClusterName && selectedTargetLevel) {
    const progress = skillsInCluster.length > 0 ? (completedSkills.size / skillsInCluster.length) * 100 : 0;
    
    return (
      <div className="w-full animate-fade-in flex flex-col md:flex-row gap-8">
        {/* Main Roadmap Area */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep('target')} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-ist-blue flex items-center transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <button onClick={resetPath} className="text-xs font-bold text-ist-blue hover:text-ist-gold transition-colors">
              Start new path
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Target className="w-48 h-48" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ist-gold bg-ist-cream px-2 py-1 rounded">Target: {selectedTargetLevel}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{selectedFamily?.t}</span>
              </div>
              <h1 className="text-3xl font-extrabold text-ist-blue mb-4 leading-tight">{selectedClusterName} Roadmap</h1>
              <p className="text-gray-500 text-sm max-w-xl">
                Here are the skills in this cluster. Select any skill to view courses, assessments, and certifications required to prove {selectedTargetLevel} proficiency. Check them off as you go.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {skillsInCluster.map((skill, idx) => {
              const isChecked = completedSkills.has(skill.n);
              const prof = PROFICIENCY_DATA[skill.n]?.[selectedTargetLevel as keyof typeof PROFICIENCY_DATA[string]];
              const hasData = prof && (prof.course || prof.assess || prof.cert);

              return (
                <div key={skill.n} className={`bg-white border rounded-2xl p-5 flex items-start gap-4 transition-all ${isChecked ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                  <button 
                    onClick={() => toggleSkillCompletion(skill.n)}
                    className={`mt-1 flex-shrink-0 transition-colors focus:outline-none ${isChecked ? 'text-green-500' : 'text-gray-300 hover:text-ist-blue'}`}
                  >
                    <CheckCircle className="w-6 h-6" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-bold text-lg mb-1 ${isChecked ? 'text-gray-600 line-through decoration-gray-300' : 'text-ist-blue'}`}>{skill.n}</h3>
                        <p className={`text-sm ${isChecked ? 'text-gray-400' : 'text-gray-500'}`}>{skill.w || 'Skill in the taxonomy'}</p>
                      </div>
                      
                      <button 
                        onClick={() => onSelectSkill(skill)}
                        className="text-xs font-bold uppercase tracking-wider text-ist-blue bg-ist-cream px-3 py-1.5 rounded-lg hover:bg-ist-gold hover:text-white transition-colors"
                      >
                        View Info
                      </button>
                    </div>

                    {!isChecked && hasData && (
                      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {prof.course && (
                          <div className="flex items-start gap-2 text-gray-500">
                            <BookOpen className="w-4 h-4 text-ist-gold flex-shrink-0 mt-0.5" />
                            <span className="truncate">Course available</span>
                          </div>
                        )}
                        {prof.cert && (
                          <div className="flex items-start gap-2 text-gray-500">
                            <Target className="w-4 h-4 text-ist-blue flex-shrink-0 mt-0.5" />
                            <span className="truncate">{prof.cert}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Summary Area */}
        <aside className="w-full md:w-80 flex-shrink-0">
          <div className="sticky top-24 bg-ist-blue rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-bl-full"></div>
            
            <h3 className="font-bold text-lg mb-6 flex items-center justify-between">
              Your Progress
              <span className="text-xs font-normal text-white/70 bg-white/10 px-2 py-1 rounded">{completedSkills.size}/{skillsInCluster.length}</span>
            </h3>

            <div className="flex items-center justify-center mb-8">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="transparent" 
                    stroke="#E6B431" 
                    strokeWidth="10" 
                    strokeDasharray={`${2 * Math.PI * 45}`} 
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold leading-none">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#e8d9b0] mb-1">Target Cluster</div>
                <div className="font-bold truncate" title={selectedClusterName}>{selectedClusterName}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#e8d9b0] mb-1">Target Level</div>
                <div className="font-bold">{selectedTargetLevel}</div>
              </div>
            </div>
            
            {progress === 100 && (
              <div className="mt-8 bg-green-500/20 border border-green-400/50 rounded-xl p-4 text-center animate-fade-in">
                <h4 className="font-bold mb-1">Path complete!</h4>
                <p className="text-xs text-white/80">You've checked off every skill in this roadmap.</p>
              </div>
            )}
          </div>
        </aside>

      </div>
    );
  }

  return null;
};
