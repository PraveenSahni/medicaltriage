import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';
import { useCustomScrollSnap } from '../hooks/useCustomScrollSnap';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  useCustomScrollSnap();

  return (
    <div className="font-sans antialiased text-ist-text dark:text-white bg-white dark:bg-ist-dark selection:bg-ist-gold selection:text-white transition-colors duration-300 min-h-screen flex flex-col">
      {/* Subtle Background - No Orbs, just clean gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-white via-gray-50 to-white dark:from-ist-dark dark:via-ist-dark-surface dark:to-ist-dark pointer-events-none" />
      
      <Navbar />

      <main className="flex-grow relative z-10 pt-20">
        {children}
      </main>

      <Footer />
    </div>
  );
};
