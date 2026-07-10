import React from 'react';
import { SectionId } from '../types';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer id={SectionId.Contact} className="relative z-10 bg-gray-50 dark:bg-ist-dark-surface pt-20 pb-10 border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="md:col-span-1">
             <a href="#" className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="IST Logo" className="h-10 w-auto object-contain" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }} />
                <div className="hidden flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-ist-blue dark:bg-ist-gold text-white flex items-center justify-center font-serif italic font-bold transition-colors">I</div>
                  <span className="font-serif font-bold text-xl tracking-tight text-ist-blue dark:text-white transition-colors">
                  IST
                  </span>
                </div>
            </a>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 transition-colors">
              Partners in Building a Smarter World. IST is a brand of IRIS STAR Technologies, a certified UAE-based digital and IT services provider.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-lg text-ist-blue dark:text-white mb-6 transition-colors">Headquarters</h4>
            <ul className="space-y-6 text-sm text-gray-600 dark:text-gray-400 transition-colors">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-ist-gold shrink-0 mt-0.5" />
                <span>
                  <strong className="block text-gray-900 dark:text-white mb-1">Dubai, UAE</strong>
                  Level 20, 48, Burj Gate Tower,<br/>Downtown Dubai<br/>P.O. BOX 22061
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-ist-gold shrink-0" />
                <span className="font-medium">+971 4 518 2632<br/>+971 4 238 6786</span>
              </li>
            </ul>
          </div>

           <div>
            <h4 className="font-serif text-lg text-ist-blue dark:text-white mb-6 transition-colors">Regional Offices</h4>
            <ul className="space-y-6 text-sm text-gray-600 dark:text-gray-400 transition-colors">
               <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-ist-gold shrink-0 mt-0.5" />
                <span>
                  <strong className="block text-gray-900 dark:text-white mb-1">Doha, Qatar</strong>
                  Office 214/215, 2nd Floor,<br/>Regus D-Ring Building no 65,<br/>D-Ring Road, Old Airport,<br/>PO Box 32522
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-ist-gold shrink-0" />
                <span className="font-medium">+974 44231183</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-ist-gold shrink-0 mt-0.5" />
                <span>
                   <strong className="block text-gray-900 dark:text-white mb-1">Chennai, India</strong>
                   Prestige Polygon, 3rd Floor,<br/>471 Anna Salai, Teynampet,<br/>Chennai-600 035, Tamil Naidu
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-ist-gold shrink-0" />
                <span className="font-medium">+91 44 4028 2542</span>
              </li>
            </ul>
          </div>

           <div>
            <h4 className="font-serif text-lg text-ist-blue dark:text-white mb-6 transition-colors">Contact & Legal</h4>
             <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-ist-gold shrink-0" />
                    <a href="mailto:info@irisstar.tech" className="font-medium hover:text-ist-blue dark:hover:text-white transition-colors">info@irisstar.tech</a>
                </li>
                <li className="pt-4"><Link to="/privacy-policy" className="hover:text-ist-gold transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-ist-gold transition-colors">Terms of Service</Link></li>
             </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-white/5 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 dark:text-gray-500 transition-colors">
            <p>© 2025 IRIS STAR Technologies. All rights reserved.</p>
            <p className="mt-2 md:mt-0 font-medium">ISO 27001 Certified • ISO 22301 Certified</p>
        </div>
      </div>
    </footer>
  );
};