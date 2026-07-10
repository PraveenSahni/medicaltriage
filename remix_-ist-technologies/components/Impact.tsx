import React from 'react';
import { SectionId, StatProps } from '../types';
import { motion } from 'framer-motion';

const stats: StatProps[] = [
  { value: "200+", label: "Consultants Deployed" },
  { value: "20+", label: "Active AI Projects" },
  { value: "ISO", label: "27001 Certified" }
];

export const Impact: React.FC = () => {
  return (
    <section id={SectionId.Impact} className="min-h-screen flex flex-col justify-center py-24 px-6 bg-ist-blue text-white relative overflow-hidden">
        {/* Decorative Circles in BG */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full border border-white/20"></div>
            <div className="absolute top-[-10%] right-[5%] w-[400px] h-[400px] rounded-full border border-white/20"></div>
        </div>

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-20 gap-10">
          <div className="max-w-2xl flex flex-col items-center">
             <motion.span 
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-ist-gold tracking-widest text-xs font-bold uppercase mb-4 block"
            >
                Our Impact
            </motion.span>
            <motion.h2 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="font-serif text-4xl md:text-5xl mb-6 leading-tight"
            >
              Built for the Region.
            </motion.h2>
            <motion.p
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.2 }}
                 className="text-blue-100 font-light text-lg"
            >
              We handle the heavy lifting—local compliance, security, and infrastructure—so you can focus on growth.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-4 text-sm font-medium text-ist-gold border-b border-ist-gold pb-1"
          >
            Trusted by Gov Entities & Leaders
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 border-t border-white/10 pt-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="font-serif text-4xl md:text-6xl mb-2 text-white">{stat.value}</div>
              <div className="text-blue-200 text-sm tracking-wide uppercase">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};