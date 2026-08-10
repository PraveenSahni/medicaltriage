import { Activity, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-semibold text-xl tracking-tight text-neutral-800 underline underline-offset-4 decoration-brand-600">
              AiMLTriage
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium uppercase tracking-widest text-neutral-500 hover:text-brand-600 transition-colors">Home</Link>
            <Link to="/platform" className="text-sm font-medium uppercase tracking-widest text-neutral-500 hover:text-brand-600 transition-colors">Platform</Link>
            <Link to="/compliance" className="text-sm font-medium uppercase tracking-widest text-neutral-500 hover:text-brand-600 transition-colors">Compliance</Link>
            <Link to="/about" className="text-sm font-medium uppercase tracking-widest text-neutral-500 hover:text-brand-600 transition-colors">About Us</Link>
            <a 
              href="#demo"
              className="inline-flex items-center justify-center bg-brand-700 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/10"
            >
              Request a Demo
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-6 space-y-4 shadow-lg">
          <Link to="/" className="block text-sm font-medium uppercase tracking-widest text-neutral-500" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/platform" className="block text-sm font-medium uppercase tracking-widest text-neutral-500" onClick={() => setIsMenuOpen(false)}>Platform</Link>
          <Link to="/compliance" className="block text-sm font-medium uppercase tracking-widest text-neutral-500" onClick={() => setIsMenuOpen(false)}>Compliance</Link>
          <Link to="/about" className="block text-sm font-medium uppercase tracking-widest text-neutral-500" onClick={() => setIsMenuOpen(false)}>About Us</Link>
          <div className="pt-4 border-t border-neutral-100">
            <a 
              href="#demo"
              className="flex items-center justify-center w-full px-5 py-3 text-xs font-bold uppercase tracking-widest text-white bg-brand-700 rounded-full hover:bg-brand-800 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Request a Demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
