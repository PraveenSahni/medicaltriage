import React, { useState, useEffect } from 'react';
import { SectionId, NavItem } from '../types';
import { Menu, X, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

const navItems: NavItem[] = [
  { label: 'Introduction', href: '/' },
  // Services is handled separately
  { label: 'Impact', href: '/#impact' },
];

const serviceLinks = [
  { label: 'Innovation', href: '/innovation' },
  { label: 'Sourcing', href: '/sourcing' },
  { label: 'Training', href: '/training' },
  { label: 'AI Skills Console', href: '/console' },
];

const BOOKING_URL = "https://outlook.office365.com/book"; 

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { openBooking } = useBooking();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (href === '/') {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (href.startsWith('/#')) {
        const id = href.replace('/#', '');
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const element = document.getElementById(id);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        navigate(href);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled 
          ? 'bg-white/95 dark:bg-ist-dark/95 backdrop-blur-sm py-4 shadow-md border-gray-200/50 dark:border-white/5' 
          : 'bg-transparent py-6 border-transparent'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {!isHomePage && (
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-ist-blue dark:text-white hover:text-ist-gold transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-wider hidden sm:block">Back</span>
            </button>
          )}
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="IST Logo" className="h-10 w-auto object-contain" onError={(e) => {
                // Fallback to text if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }} />
              <div className="hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ist-blue dark:bg-ist-gold text-white flex items-center justify-center font-serif italic font-bold transition-colors shadow-sm">I</div>
                <span className="font-serif font-bold text-xl tracking-tight text-ist-blue dark:text-white group-hover:text-ist-gold transition-colors">
                IST
                </span>
              </div>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {/* Introduction Link */}
          <a
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-ist-blue dark:hover:text-ist-gold tracking-wide uppercase transition-colors relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-ist-gold after:bottom-[-4px] after:left-0 hover:after:w-full after:transition-all"
          >
            Introduction
          </a>

          {/* Services Dropdown */}
          <div 
            className="relative group"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-ist-blue dark:hover:text-ist-gold tracking-wide uppercase transition-colors">
              Services <ChevronDown className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-48"
                >
                  <div className="bg-white dark:bg-ist-dark-surface border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden p-2 flex flex-col gap-1">
                    {serviceLinks.map((service) => (
                      <Link
                        key={service.label}
                        to={service.href}
                        className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-ist-blue dark:hover:text-ist-gold rounded-lg transition-colors"
                      >
                        {service.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Impact Link */}
          <a
            href="/#impact"
            onClick={(e) => handleNavClick(e, '/#impact')}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-ist-blue dark:hover:text-ist-gold tracking-wide uppercase transition-colors relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-ist-gold after:bottom-[-4px] after:left-0 hover:after:w-full after:transition-all"
          >
            Impact
          </a>
          
          <div className="w-[1px] h-6 bg-gray-300 dark:bg-white/20 mx-2"></div>
          
          <ThemeToggle />

          {/* CTA Button */}
          <button
            onClick={openBooking}
            className="px-6 py-2 rounded-full bg-ist-blue dark:bg-white text-white dark:text-ist-blue text-sm font-bold hover:bg-ist-gold dark:hover:bg-ist-gold dark:hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Book a Call
          </button>
        </div>

        {/* Mobile Toggle & Theme (Visible on Mobile) */}
        <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button
            className="text-ist-blue dark:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
            {mobileMenuOpen ? <X /> : <Menu />}
            </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-ist-dark border-t border-gray-100 dark:border-white/10 absolute w-full shadow-xl"
          >
            <div className="flex flex-col p-6 gap-4">
              <a
                href="/"
                onClick={(e) => handleNavClick(e, '/')}
                className="text-lg font-serif text-ist-blue dark:text-white font-medium"
              >
                Introduction
              </a>
              
              <div className="flex flex-col gap-2 pl-4 border-l-2 border-gray-100 dark:border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Services</span>
                {serviceLinks.map((service) => (
                  <Link
                    key={service.label}
                    to={service.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-serif text-ist-blue dark:text-white font-medium"
                  >
                    {service.label}
                  </Link>
                ))}
              </div>

              <a
                href="/#impact"
                onClick={(e) => handleNavClick(e, '/#impact')}
                className="text-lg font-serif text-ist-blue dark:text-white font-medium"
              >
                Impact
              </a>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openBooking();
                }}
                className="mt-2 px-6 py-3 rounded-full bg-ist-blue dark:bg-ist-gold text-white text-center font-bold"
              >
                Book a Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
