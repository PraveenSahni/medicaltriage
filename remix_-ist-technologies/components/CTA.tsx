import React from 'react';
import { SectionId } from '../types';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useBooking } from '../context/BookingContext';

export const CTA: React.FC = () => {
  const { openBooking } = useBooking();

  return (
    <section className="flex flex-col justify-center py-32 md:py-48 px-6 relative z-10 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ist-gold/5 dark:bg-ist-gold/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto text-center max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-6xl text-ist-blue dark:text-white mb-8 transition-colors"
        >
          Ready to <span className="italic text-ist-gold">Scale?</span>
        </motion.h2>
        
        <motion.p
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.1 }}
           className="text-gray-500 dark:text-gray-400 text-lg md:text-xl mb-12 font-light transition-colors"
        >
          Elite teams. Custom AI. Local expertise. Ready when you are.
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
        >
            <button 
                onClick={openBooking}
                className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-ist-blue dark:bg-ist-gold text-white dark:text-ist-blue text-lg font-medium hover:bg-ist-gold hover:text-white dark:hover:bg-white dark:hover:text-ist-blue transition-all duration-300 shadow-xl shadow-ist-blue/10 dark:shadow-none hover:scale-105"
            >
                Book a Call
                <ArrowRight className="w-5 h-5" />
            </button>
        </motion.div>
      </div>
    </section>
  );
};