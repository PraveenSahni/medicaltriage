import React from 'react';
import { SectionId, ServiceCardProps } from '../types';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SERVICES: ServiceCardProps[] = [
  {
    title: "Innovation",
    subtitle: "I",
    description: "Enterprise-grade AI, data governance, and digital engineering.",
    icon: null,
    bullets: [],
    delay: 0
  },
  {
    title: "Sourcing",
    subtitle: "S",
    description: "Staff augmentation and managed squads, deployed in 48 hours.",
    icon: null,
    bullets: [],
    delay: 0.1
  },
  {
    title: "Training",
    subtitle: "T",
    description: "Campus-to-corporate programs that create deployment-ready engineers.",
    icon: null,
    bullets: [],
    delay: 0.2
  }
];

interface ServicesProps {
  onOpenInnovation: () => void;
  onOpenSourcing: () => void;
  onOpenTraining: () => void;
}

const ServiceCard: React.FC<ServiceCardProps & { link: string }> = ({ 
  title, description, delay, link 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative bg-white dark:bg-ist-dark-surface border border-gray-200 dark:border-white/10 p-8 rounded-2xl hover:border-ist-blue dark:hover:border-ist-gold transition-colors duration-300 flex flex-col h-full"
    >
      <div className="flex-grow">
        <h3 className="font-serif text-2xl font-bold text-ist-blue dark:text-white mb-4">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{description}</p>
      </div>

      <Link to={link} className="inline-flex items-center gap-2 text-ist-blue dark:text-ist-gold font-bold text-sm group-hover:gap-3 transition-all">
        Explore {title} <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
};

export const Services: React.FC<ServicesProps> = () => {
  return (
    <section id={SectionId.Services} className="py-24 px-6 z-10">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard {...SERVICES[0]} link="/innovation" />
          <ServiceCard {...SERVICES[1]} link="/sourcing" />
          <ServiceCard {...SERVICES[2]} link="/training" />
        </div>
      </div>
    </section>
  );
};
