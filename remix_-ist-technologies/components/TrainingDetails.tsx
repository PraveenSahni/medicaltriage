import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Target, ShieldCheck, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

const trainingPillars = [
  {
    id: "precision-hiring",
    title: "Precision Hiring",
    icon: <Target className="w-12 h-12 text-ist-gold" />,
    description: "Hiring for aptitude is more reliable than hiring for skill. We use a battery of psychometric, logical, and technical assessments to identify high-potential candidates who are wired for success in a technical career.",
    capabilities: [
      "Psychometric & Aptitude Profiling",
      "Logic & Problem-Solving Tests",
      "Role-specific Competency Mapping",
      "Cultural Fit & Behavioral Interviews",
      "Assessment Center Design & Facilitation"
    ],
    deliverables: [
      "Candidate Assessment Reports",
      "Hiring Recommendation Scorecards",
      "Customized Selection Framework",
      "Onboarding & Development Roadmap"
    ],
    outcomes: [
      "Higher long-term retention rates",
      "Reduced training dropout/failure",
      "Stronger team alignment & culture",
      "Data-driven, predictable hiring"
    ]
  },
  {
    id: "foundation-skills",
    title: "Foundation & Core Skills",
    icon: <ShieldCheck className="w-12 h-12 text-ist-gold" />,
    description: "We build the professional and technical bedrock required for a successful career in enterprise technology. This includes intensive training on corporate etiquette, communication, Agile methodologies, and secure coding practices.",
    capabilities: [
      "Corporate Etiquette & Communication",
      "Agile & DevOps Fundamentals",
      "Banking Domain Overview (BFSI)",
      "Secure Coding Practices (OWASP)",
      "Version Control & Collaboration Tools"
    ],
    deliverables: [
      "Soft Skills Certification",
      "Technical Baseline Assessment",
      "Individual Development Plans",
      "Project-ready Collaboration Skills"
    ],
    outcomes: [
      "Professional workplace conduct",
      "Seamless integration into Agile teams",
      "Understanding of banking context",
      "Reduced security vulnerabilities"
    ]
  },
  {
    id: "specialized-training",
    title: "Specialized Domain Training",
    icon: <BookOpen className="w-12 h-12 text-ist-gold" />,
    description: "Our curriculum provides deep, hands-on expertise in critical banking platforms. We specialize in Finacle, Digital Banking channels, APIs, and modern payment systems, ensuring graduates are productive from day one.",
    capabilities: [
      "Finacle Core & Treasury (Ver. 11.x)",
      "Digital Banking Channels & APIs",
      "Payment Systems (Swift, ISO20022)",
      "Data & Analytics for Banking",
      "Real-world Capstone Projects"
    ],
    deliverables: [
      "Finacle Certification (Functional/Technical)",
      "Capstone Project Code & Documentation",
      "SME Mentorship & Code Review Logs",
      "Final Deployment-Readiness Rating"
    ],
    outcomes: [
      "Day-1 project productivity",
      "Reduced dependency on senior staff",
      "Compliance with industry standards",
      "Accelerated digital transformation"
    ]
  }
];

export const TrainingDetails: React.FC = () => {
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
                    <span className="text-ist-gold">T</span>raining
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
                We bridge the gap between academic theory and production reality. Our Campus-to-Corporate programs turn local graduates into deployment-ready banking professionals.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 w-full">
              {trainingPillars.map((pillar, index) => (
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
          {trainingPillars.map((pillar) => (
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
            <h2 className="text-5xl md:text-7xl font-bold mb-8 text-ist-blue dark:text-white">Build Your Future Workforce.</h2>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 font-light">
                Let's design a training program that delivers measurable ROI.
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
