import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Cpu, Database, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

const innovationPillars = [
  {
    id: "ai-services",
    title: "AI Services",
    icon: <Cpu className="w-12 h-12 text-ist-gold" />,
    description: "We deliver AI solutions that work in real workflows, not just demos. From GenAI to ML modernization to LLMOps, we build, deploy, and govern AI with clear performance and risk controls.",
    capabilities: [
      "AI Strategy & Use Case Prioritization",
      "Generative AI & RAG Systems",
      "ML Model Development & Modernization",
      "LLMOps & MLOps Engineering",
      "Responsible AI & Governance"
    ],
    deliverables: [
      "AI Use Case Portfolio & ROI Analysis",
      "Production-ready AI/ML Models",
      "Automated Model Training Pipelines",
      "Monitoring & Alerting Dashboards",
      "AI Governance Framework"
    ],
    outcomes: [
      "Faster Time-to-Value for AI",
      "Reduced Operational Risk",
      "Predictable AI Performance & Cost",
      "Measurable Business Impact"
    ]
  },
  {
    id: "data-management",
    title: "Data Management",
    icon: <Database className="w-12 h-12 text-ist-gold" />,
    description: "AI and analytics fail without trusted data. We help you create a modern data foundation that is governed, discoverable, and analytics-ready across the organization.",
    capabilities: [
      "Data Strategy & Target Architecture",
      "Cloud Data Platform Engineering",
      "Data Integration & Modernization",
      "Data Governance & Quality",
      "Data Security & Privacy Controls"
    ],
    deliverables: [
      "Data Strategy & Platform Blueprint",
      "Production Data Pipelines",
      "Curated & Governed Reporting Layer",
      "Data Catalog & Lineage Maps",
      "Data Quality Dashboards"
    ],
    outcomes: [
      "Trusted, Single Source of Truth",
      "Faster Data Onboarding & Integration",
      "Reduced Data-related Incidents",
      "Lower Total Cost of Ownership"
    ]
  },
  {
    id: "digital-engineering",
    title: "Digital Engineering",
    icon: <Code className="w-12 h-12 text-ist-gold" />,
    description: "We engineer digital solutions that scale cleanly and remain maintainable. This includes cloud foundations, secure integrations, modern applications, and product platforms.",
    capabilities: [
      "Cloud Engineering & DevSecOps",
      "Digital Experience Platforms (Web/Mobile)",
      "Enterprise Integration & APIs",
      "Product & Platform Engineering",
      "Site Reliability Engineering (SRE)"
    ],
    deliverables: [
      "Cloud Reference Architecture",
      "Secure CI/CD Pipelines",
      "Scalable & Resilient Applications",
      "API Specifications & Developer Portal",
      "Operations & Support Runbooks"
    ],
    outcomes: [
      "Shorter Software Release Cycles",
      "Higher System Uptime & Reliability",
      "Lower Long-term Maintenance Costs",
      "Secure-by-Default Infrastructure"
    ]
  }
];

export const InnovationDetails: React.FC = () => {
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
                    <span className="text-ist-gold">I</span>nnovation
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
                We turn "AI hype" into production-grade systems. From Enterprise Data Platforms to GenAI pilots, we build the intelligence that powers your future.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 w-full">
              {innovationPillars.map((pillar, index) => (
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
          {innovationPillars.map((pillar) => (
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-200 dark:border-white/10 pt-12">
                <div className="flex flex-col items-center">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-ist-gold mb-6">Core Capabilities</h4>
                  <ul className="space-y-4 text-left inline-block">
                    {pillar.capabilities.map((item, i) => (
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
                    {pillar.deliverables.map((item, i) => (
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
                    {pillar.outcomes.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="leading-relaxed font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="flex flex-col justify-center py-32 md:py-48 px-6 md:px-20 bg-white dark:bg-ist-dark text-center">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 text-ist-blue dark:text-white">Ready to build?</h2>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 font-light">
                Let's scope the fastest path to a working outcome.
            </p>
            <button 
                onClick={openBooking}
                className="px-10 py-5 rounded-full bg-ist-blue dark:bg-white text-white dark:text-ist-blue font-bold hover:scale-105 transition-transform shadow-lg"
            >
                Book a Discovery Call
            </button>
        </div>
      </section>

    </div>
  );
};
