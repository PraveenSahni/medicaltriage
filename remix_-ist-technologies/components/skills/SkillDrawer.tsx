import React from 'react';
import { X, ExternalLink, Activity, HelpCircle, Book, Target, ChevronDown } from 'lucide-react';
import { Skill } from '../../types/console';
import { PROFICIENCY_DATA } from '../../data/consoleData';
import { motion, AnimatePresence } from 'framer-motion';

interface SkillDrawerProps {
  skill: Skill | null;
  onClose: () => void;
}

export const SkillDrawer: React.FC<SkillDrawerProps> = ({ skill, onClose }) => {
  if (!skill) return null;

  const prof = PROFICIENCY_DATA[skill.n];
  const u = skill.u || 0;
  const i = skill.i || 0;
  const pinPos = skill.d == null ? 50 : Math.max(2, Math.min(98, 50 + (skill.d / 2)));
  
  const levels = ['L1', 'L2', 'L3', 'L4'] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Scrim */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-ist-dark/30 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Drawer Panel */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col pt-safe pb-safe outline-none z-10"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-lg text-gray-400 hover:text-ist-blue hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-[10px] font-bold tracking-widest uppercase text-ist-gold mb-2 pr-8">{skill.c}</div>
            <h3 className="text-2xl font-extrabold text-ist-blue mb-3 pr-8 leading-tight">{skill.n}</h3>
            <p className="text-sm text-gray-600 leading-relaxed pr-4">
              {skill.w || 'Skill in the Enterprise AI competency taxonomy.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
            
            {/* Talent supply signal */}
            <section>
              <h4 className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-400 mb-4 after:content-[''] after:flex-1 after:h-px after:bg-gray-100">
                <Activity className="w-4 h-4" /> Talent supply signal
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">UAE AVAILABILITY</div>
                  <div className="text-3xl font-extrabold text-ist-blue">{skill.u || '–'}<span className="text-sm font-normal text-gray-400">/100</span></div>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-ist-blue rounded-full" style={{ width: `${u}%` }}></div>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">IND AVAILABILITY</div>
                  <div className="text-3xl font-extrabold text-ist-gold">{skill.i || '–'}<span className="text-sm font-normal text-gray-400">/100</span></div>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-ist-gold rounded-full" style={{ width: `${i}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center gap-4">
                <div className="flex-1 h-2 rounded-full overflow-hidden relative bg-gradient-to-r from-red-400 via-[#e8d9b0] to-green-500 shadow-inner">
                  <div className="absolute top-0 bottom-0 w-1 bg-ist-dark rounded outline outline-2 outline-white shadow-sm" style={{ left: `${pinPos}%`, transform: 'translateX(-50%)' }}></div>
                </div>
                <div className="text-xs text-gray-600 min-w-[120px]">
                  {skill.d == null ? 'No relative signal.' : skill.d > 0 ? <><strong className="text-ist-dark font-medium">Easier to source</strong> (+{skill.d})</> : skill.d < 0 ? <><strong className="text-ist-dark font-medium">Scarce / Competitive</strong> ({skill.d})</> : 'Balanced supply/demand.'}
                </div>
              </div>
            </section>

            {/* Proficiency Ladder */}
            <section>
              <h4 className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-400 mb-4 after:content-[''] after:flex-1 after:h-px after:bg-gray-100">
                <Target className="w-4 h-4" /> Proficiency ladder
              </h4>
              <div className="space-y-3">
                {levels.map(lv => {
                  const data = prof?.[lv];
                  const labels = { L1: 'Beginner', L2: 'Intermediate', L3: 'Advanced', L4: 'Expert' };
                  const descs  = { L1: 'Foundations', L2: 'Standard delivery', L3: 'Complex design', L4: 'Strategy & mentoring' };
                  
                  return (
                    <details key={lv} className="group border border-gray-100 bg-white rounded-xl shadow-sm open:bg-gray-50 transition-colors">
                      <summary className="flex items-center gap-4 p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ist-gold rounded-xl list-none list-item-none custom-summary">
                        <div className="w-8 h-8 rounded-lg bg-ist-blue text-white flex items-center justify-center font-bold text-xs flex-shrink-0 group-open:bg-ist-gold transition-colors">{lv}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">{labels[lv]}</div>
                          <div className="text-[11px] text-gray-500 uppercase tracking-wider">{descs[lv]}</div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:-rotate-180" />
                      </summary>
                      
                      <div className="px-4 pb-4 pt-1 ml-12 text-sm text-gray-600 space-y-3 border-t border-gray-100 mt-2 p-3">
                        {data ? (
                          <>
                            {data.course && <div><span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Course</span>{data.course}</div>}
                            {data.assess && <div><span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Assessment</span>{data.assess}</div>}
                            {data.cert && <div><span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Certification</span>{data.cert}</div>}
                          </>
                        ) : (
                          <div className="italic text-gray-400 text-xs py-2">Criteria generic or not detailed in source.</div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>

          </div>
          
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
