import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { BrainCircuit, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

export const Hero: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const { openBooking } = useBooking();

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    let { left, top, width, height } = currentTarget.getBoundingClientRect();
    let xPoint = clientX - left - width / 2;
    let yPoint = clientY - top - height / 2;
    mouseX.set(xPoint);
    mouseY.set(yPoint);
  }

  return (
    <div className="bg-white dark:bg-ist-dark overflow-hidden">
      
      {/* Section 1: Hero / Intro */}
      <section 
        className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-20 overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            <motion.div 
                className="absolute inset-0 opacity-30 dark:opacity-20"
                style={{
                    background: useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(29, 78, 216, 0.15), transparent 80%)`
                }}
            />
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 flex flex-col items-center max-w-5xl mx-auto w-full"
        >
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.05, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                style={{ x: useTransform(mouseX, [-500, 500], [15, -15]), y: useTransform(mouseY, [-500, 500], [15, -15]) }}
                className="font-sans font-bold text-[25vw] md:text-[18rem] text-ist-blue dark:text-white leading-none tracking-tighter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none pointer-events-none whitespace-nowrap"
            >
                IST
            </motion.h1>

            <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-ist-gold font-bold tracking-[0.3em] md:tracking-[0.5em] uppercase text-xs md:text-base mb-4 md:mb-6"
            >
                IRIS STAR Technologies
            </motion.span>
            
            <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-4xl sm:text-5xl md:text-7xl font-bold text-ist-blue dark:text-white mb-8 text-center leading-tight"
            >
                The Digital Engine <br/> for the GCC.
            </motion.h2>

            <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                onClick={() => {
                  const element = document.getElementById('dna');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-8 md:mt-12 text-gray-400 animate-bounce cursor-pointer hover:text-ist-gold transition-colors"
                aria-label="Scroll down"
            >
                <ArrowRight className="w-6 h-6 rotate-90" />
            </motion.button>
        </motion.div>
      </section>

      {/* Section 2: Our DNA */}
      <section id="dna" className="min-h-screen flex flex-col justify-center items-center py-24 px-6 bg-gray-50 dark:bg-ist-dark-surface">
        <div className="max-w-5xl mx-auto text-center">
            <p className="text-xl text-gray-500 uppercase tracking-widest mb-20">Our DNA</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24 items-start justify-center mb-16">
                {/* Innovation */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center group"
                >
                    <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-white/5 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                        <BrainCircuit className="w-10 h-10 text-ist-gold" />
                    </div>
                    <span className="text-7xl md:text-8xl font-bold text-ist-blue dark:text-white mb-4 leading-none">I</span>
                    <span className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 group-hover:text-ist-blue dark:group-hover:text-white transition-colors">Innovation</span>
                </motion.div>

                {/* Sourcing */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col items-center group"
                >
                    <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-white/5 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                        <Users className="w-10 h-10 text-ist-gold" />
                    </div>
                    <span className="text-7xl md:text-8xl font-bold text-ist-blue dark:text-white mb-4 leading-none">S</span>
                    <span className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 group-hover:text-ist-blue dark:group-hover:text-white transition-colors">Sourcing</span>
                </motion.div>

                {/* Training */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col items-center group"
                >
                    <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-white/5 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                        <GraduationCap className="w-10 h-10 text-ist-gold" />
                    </div>
                    <span className="text-7xl md:text-8xl font-bold text-ist-blue dark:text-white mb-4 leading-none">T</span>
                    <span className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 group-hover:text-ist-blue dark:group-hover:text-white transition-colors">Training</span>
                </motion.div>
            </div>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Three distinct capabilities. One unified mission.
            </p>
        </div>
      </section>

      {/* Section 3: Innovation */}
      <section id="services" className="min-h-screen flex flex-col justify-center py-24 px-6">
        <div className="max-w-6xl mx-auto w-full">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full"
            >
                <Link to="/innovation" className="group block w-full bg-white dark:bg-ist-dark-surface rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                  <div className="flex flex-col md:flex-row items-stretch min-h-[400px]">
                    {/* Content Area */}
                    <div className="p-10 md:p-16 md:w-1/2 flex flex-col justify-center relative z-10 bg-white dark:bg-ist-dark-surface">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-ist-blue/5 dark:bg-white/5 rounded-xl text-ist-blue dark:text-ist-gold">
                              <BrainCircuit className="w-6 h-6" />
                          </div>
                          <span className="text-ist-gold font-bold tracking-widest uppercase text-sm">Innovation</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold text-ist-blue dark:text-white mb-6">
                          <span className="text-ist-gold">I</span>nnovation
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                          We turn "AI hype" into production-grade systems. From Enterprise Data Platforms to GenAI pilots, we build the intelligence that powers your future.
                      </p>
                      <div className="inline-flex items-center gap-2 text-lg font-bold text-ist-blue dark:text-white group-hover:text-ist-gold transition-colors mt-auto">
                          Explore Innovation Capabilities <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                    
                    {/* Visual Area */}
                    <div className="md:w-1/2 bg-gray-50 dark:bg-white/5 relative flex items-center justify-center min-h-[300px] overflow-hidden">
                      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                      <BrainCircuit className="w-48 h-48 text-ist-blue/10 dark:text-white/10 transform group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  </div>
                </Link>
            </motion.div>
        </div>
      </section>

      {/* Section 4: Sourcing */}
      <section className="min-h-screen flex flex-col justify-center py-24 px-6 bg-gray-50 dark:bg-ist-dark-surface">
        <div className="max-w-6xl mx-auto w-full">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full"
            >
                <Link to="/sourcing" className="group block w-full bg-white dark:bg-ist-dark rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                  <div className="flex flex-col md:flex-row-reverse items-stretch min-h-[400px]">
                    {/* Content Area */}
                    <div className="p-10 md:p-16 md:w-1/2 flex flex-col justify-center relative z-10 bg-white dark:bg-ist-dark">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-ist-blue/5 dark:bg-white/5 rounded-xl text-ist-blue dark:text-ist-gold">
                              <Users className="w-6 h-6" />
                          </div>
                          <span className="text-ist-gold font-bold tracking-widest uppercase text-sm">Sourcing</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold text-ist-blue dark:text-white mb-6">
                          <span className="text-ist-gold">S</span>ourcing
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                          Elite tech talent, vetted and managed. Whether you need a single architect or a full squad, we deploy experts in 48 hours.
                      </p>
                      <div className="inline-flex items-center gap-2 text-lg font-bold text-ist-blue dark:text-white group-hover:text-ist-gold transition-colors mt-auto">
                          Explore Talent Solutions <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                    
                    {/* Visual Area */}
                    <div className="md:w-1/2 bg-gray-50 dark:bg-white/5 relative flex items-center justify-center min-h-[300px] overflow-hidden">
                      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                      <Users className="w-48 h-48 text-ist-blue/10 dark:text-white/10 transform group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  </div>
                </Link>
            </motion.div>
        </div>
      </section>

      {/* Section 5: Training */}
      <section className="min-h-screen flex flex-col justify-center py-24 px-6">
        <div className="max-w-6xl mx-auto w-full">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full mb-24"
            >
                <Link to="/training" className="group block w-full bg-white dark:bg-ist-dark-surface rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                  <div className="flex flex-col md:flex-row items-stretch min-h-[400px]">
                    {/* Content Area */}
                    <div className="p-10 md:p-16 md:w-1/2 flex flex-col justify-center relative z-10 bg-white dark:bg-ist-dark-surface">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-ist-blue/5 dark:bg-white/5 rounded-xl text-ist-blue dark:text-ist-gold">
                              <GraduationCap className="w-6 h-6" />
                          </div>
                          <span className="text-ist-gold font-bold tracking-widest uppercase text-sm">Training</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold text-ist-blue dark:text-white mb-6">
                          <span className="text-ist-gold">T</span>raining
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                          Campus-to-corporate programs. We bridge the gap between academic theory and production reality for the next generation.
                      </p>
                      <div className="inline-flex items-center gap-2 text-lg font-bold text-ist-blue dark:text-white group-hover:text-ist-gold transition-colors mt-auto">
                          View Academy Programs <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                    
                    {/* Visual Area */}
                    <div className="md:w-1/2 bg-gray-50 dark:bg-white/5 relative flex items-center justify-center min-h-[300px] overflow-hidden">
                      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                      <GraduationCap className="w-48 h-48 text-ist-blue/10 dark:text-white/10 transform group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  </div>
                </Link>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-32 flex flex-col items-center text-center pb-20"
            >
                <p className="text-gray-500 uppercase tracking-widest text-sm mb-8">Ready to switch on the engine?</p>
                <button 
                    onClick={openBooking}
                    className="px-12 py-6 rounded-full bg-ist-blue dark:bg-ist-gold text-white dark:text-ist-blue font-bold text-xl shadow-2xl hover:scale-105 transition-transform hover:shadow-ist-blue/20"
                >
                    Book a Discovery Call
                </button>
            </motion.div>
        </div>
      </section>

    </div>
  );
};
