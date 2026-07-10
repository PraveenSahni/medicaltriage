import React from 'react';

export const OrbBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-ist-cream dark:bg-ist-dark transition-colors duration-500">
       {/* Minimal Grid Pattern */}
       <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] text-ist-blue dark:text-white" 
            style={{ 
                backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
            }} 
       />
    </div>
  );
};
