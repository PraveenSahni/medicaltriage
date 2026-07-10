import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, Zap, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

const sourcingPillars = [
  {
    id: "managed-extended-teams",
    title: "Managed & Extended Teams",
    icon: <Users className="w-12 h-12 text-ist-gold" />,
    description: "IST helps you scale delivery with the right talent model for your business needs. Whether you need a fully managed delivery team with outcome ownership or an extended team that integrates into your existing setup, we build high-performance digital teams that move fast, stay aligned, and deliver consistently.",
    customContent: (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-gray-200 dark:border-white/10 pt-12">
          {/* Managed Teams */}
          <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
            <h3 className="text-2xl font-bold text-ist-blue dark:text-white mb-2">Managed Teams</h3>
            <p className="text-ist-gold font-medium mb-6">Outcome-Focused Delivery Teams</p>
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              IST builds and manages dedicated teams aligned to your delivery goals, timelines, and quality standards. We take ownership of execution, governance, and team coordination so your internal stakeholders can focus on priorities, not day-to-day resource management.
            </p>
            
            <h4 className="text-sm font-bold uppercase tracking-wider text-ist-gold mb-4">Key Benefits</h4>
            <ul className="space-y-6 mb-8">
              <li>
                <strong className="block text-ist-blue dark:text-white mb-1">Delivery Ownership</strong>
                <span className="text-gray-600 dark:text-gray-400 text-sm">IST-led team accountable for delivery outcomes and quality.</span>
              </li>
              <li>
                <strong className="block text-ist-blue dark:text-white mb-1">Faster Execution</strong>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Ready-to-deploy team structure with agile governance.</span>
              </li>
              <li>
                <strong className="block text-ist-blue dark:text-white mb-1">Predictable Cost</strong>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Better visibility, continuity, and controlled delivery spend.</span>
              </li>
            </ul>

            <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl">
              <h4 className="text-sm font-bold uppercase tracking-wider text-ist-gold mb-3">When to choose</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-ist-gold mt-0.5 shrink-0" />
                  <span>You want IST to own delivery execution</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-ist-gold mt-0.5 shrink-0" />
                  <span>You need faster mobilization with governance included</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-ist-gold mt-0.5 shrink-0" />
                  <span>You prefer milestone/outcome-based management</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Extended Teams */}
          <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
            <h3 className="text-2xl font-bold text-ist-blue dark:text-white mb-2">Extended Teams</h3>
            <p className="text-ist-gold font-medium mb-6">Scale Your Existing Team, Fast</p>
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              IST provides vetted professionals who integrate seamlessly into your internal teams, tools, and workflows. This model is ideal when you want to retain direct control while quickly expanding capacity across engineering, product, QA, data, cloud, or support functions.
            </p>
            
            <h4 className="text-sm font-bold uppercase tracking-wider text-ist-gold mb-4">Key Benefits</h4>
            <ul className="space-y-6 mb-8">
              <li>
                <strong className="block text-ist-blue dark:text-white mb-1">Seamless Integration</strong>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Vetted experts aligned to your tools, stack, and workflows.</span>
              </li>
              <li>
                <strong className="block text-ist-blue dark:text-white mb-1">On-Demand Scaling</strong>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Scale capacity quickly as priorities shift.</span>
              </li>
              <li>
                <strong className="block text-ist-blue dark:text-white mb-1">Cost Optimization</strong>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Reduce hiring delays and improve delivery efficiency.</span>
              </li>
            </ul>

            <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl">
              <h4 className="text-sm font-bold uppercase tracking-wider text-ist-gold mb-3">When to choose</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-ist-gold mt-0.5 shrink-0" />
                  <span>You already have delivery leadership in place</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-ist-gold mt-0.5 shrink-0" />
                  <span>You need to quickly add capacity or niche skills</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-ist-gold mt-0.5 shrink-0" />
                  <span>You want direct day-to-day control of resources</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center bg-ist-blue/5 dark:bg-ist-gold/10 p-8 rounded-2xl border border-ist-blue/10 dark:border-ist-gold/20">
          <h4 className="text-xl font-bold text-ist-blue dark:text-white mb-2">Need help choosing the right model?</h4>
          <p className="text-gray-600 dark:text-gray-300">
            Tell us your requirement and we'll recommend the best sourcing setup: Managed Team, Extended Team, or a hybrid approach.
          </p>
        </div>
      </div>
    )
  },
  {
    id: "rpo",
    title: "Recruitment Process Outsourcing",
    icon: <Zap className="w-12 h-12 text-ist-gold" />,
    description: "For high-volume hiring, we become your embedded talent acquisition engine. Our RPO service manages the entire recruitment lifecycle—from sourcing and screening to offer management—allowing your team to focus on core business goals.",
    capabilities: [
      "Requisition Management",
      "Multi-channel Candidate Sourcing",
      "Technical & Cultural Screening",
      "Interview Coordination",
      "Offer Management & Negotiation",
      "Employer Branding Support"
    ],
    deliverables: [
      "Live Candidate Pipeline Report",
      "Time-to-Fill & Cost-per-Hire Metrics",
      "Market & Compensation Analysis",
      "Candidate Experience Surveys",
      "Onboarding Support"
    ],
    outcomes: [
      "Predictable Hiring Pipeline",
      "Reduced Average Time-to-Hire",
      "Improved Candidate Quality & Fit",
      "Scalable Recruitment Function"
    ]
  },
  {
    id: "recruitment-services",
    title: "Recruitment Services",
    icon: <Search className="w-12 h-12 text-ist-gold" />,
    description: "Targeted search for critical hires. Our specialized recruiters leverage a deep network to find senior, niche, and leadership talent that isn't available on the open market. We offer both Contingent and Retained models.",
    capabilities: [
      "Executive Search for Leadership Roles",
      "Niche & 'Hard-to-Fill' Skill Sourcing",
      "Confidential & Discreet Searches",
      "Market Mapping & Talent Intelligence",
      "In-depth Technical Assessments",
      "Reference & Background Checks"
    ],
    deliverables: [
      "Shortlist of Qualified Candidates",
      "Detailed Candidate Profiles & Scorecards",
      "Compensation Benchmarking Report",
      "Weekly Search Progress Updates",
      "Post-placement Follow-up"
    ],
    outcomes: [
      "Access to Passive, High-Caliber Talent",
      "Faster Placement for Critical Roles",
      "Better Long-term Hire Retention",
      "Competitive Market Intelligence"
    ]
  }
];

export const SourcingDetails: React.FC = () => {
  const navigate = useNavigate();
  const { openBooking } = useBooking();

  const onBack = () => navigate('/');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-ist-dark text-ist-blue dark:text-white font-sans selection:bg-ist-gold selection:text-white overflow-x-hidden">
      
      <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-8 px-6 md:px-20 text-left">
        <div className="max-w-7xl mx-auto flex flex-col items-start w-full">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <span className="text-ist-gold font-bold tracking-[0.2em] uppercase text-sm">Capabilities</span>
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight mb-6"
            >
                <span className="text-ist-blue dark:text-white relative">
                    <span className="text-ist-gold">S</span>ourcing
                </span>
                <br />
                <span className="text-gray-200 dark:text-white/10">Engineered.</span>
            </motion.h1>

            <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-3xl leading-relaxed font-light mb-8"
            >
                We turn "hiring" into a precision engine. From Extended Engineering Teams to R&D Labs, we build the capacity that powers your future.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 w-full">
              {sourcingPillars.map((pillar, index) => (
                <motion.div
                  key={pillar.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => scrollToSection(pillar.id)}
                  className="group relative border-t border-gray-200 dark:border-white/10 pt-6 hover:border-ist-gold dark:hover:border-ist-gold transition-colors duration-500 cursor-pointer flex flex-col items-center text-center"
                >
                  <div className="mb-4 opacity-80 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-500">
                    {React.cloneElement(pillar.icon as React.ReactElement, { className: "w-10 h-10 text-ist-gold" })}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-ist-gold transition-colors duration-300 min-h-[3rem] flex items-center justify-center">
                    {pillar.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-base">
                    {pillar.description}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 text-ist-gold font-bold uppercase tracking-wider text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </div>
        </div>
      </section>

      <div className="bg-gray-50 dark:bg-ist-dark-surface">
        <div className="px-6 md:px-20">
          {sourcingPillars.map((pillar) => (
            <section key={pillar.id} id={pillar.id} className="min-h-screen flex flex-col justify-center py-20 scroll-mt-0 text-center">
              <div className="flex flex-col items-center gap-6 mb-12">
                <div className="p-4 bg-white dark:bg-white/5 rounded-2xl shadow-sm inline-flex">
                  {pillar.icon}
                </div>
                <div className="flex flex-col items-center">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-ist-blue dark:text-white">{pillar.title}</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>

              {pillar.customContent ? (
                pillar.customContent
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-200 dark:border-white/10 pt-12">
                  <div className="flex flex-col items-center">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-ist-gold mb-6">Core Capabilities</h4>
                    <ul className="space-y-4 text-left inline-block">
                      {pillar.capabilities?.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-2 shrink-0"></span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col items-center">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-ist-gold mb-6">Deliverables</h4>
                    <ul className="space-y-4 text-left inline-block">
                      {pillar.deliverables?.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-2 shrink-0"></span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col items-center">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-ist-gold mb-6">Outcomes</h4>
                    <ul className="space-y-4 text-left inline-block">
                      {pillar.outcomes?.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="leading-relaxed font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      <section className="flex flex-col justify-center py-32 md:py-48 px-6 md:px-20 bg-white dark:bg-ist-dark text-center">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 text-ist-blue dark:text-white">Ready to Ship?</h2>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 font-light">
                Share your requirement. We’ll respond with a shortlist and a rollout plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                    onClick={openBooking}
                    className="px-10 py-5 rounded-full bg-ist-blue dark:bg-white text-white dark:text-ist-blue font-bold text-lg hover:bg-ist-gold dark:hover:bg-ist-gold dark:hover:text-white transition-all shadow-xl"
                >
                    Get a Shortlist
                </button>
                <button 
                    onClick={openBooking}
                    className="px-10 py-5 rounded-full border border-gray-200 dark:border-white/20 text-ist-blue dark:text-white font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Book a Discovery Call
                </button>
            </div>
        </div>
      </section>

    </div>
  );
};
