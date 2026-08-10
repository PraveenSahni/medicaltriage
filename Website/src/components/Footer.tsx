import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white text-neutral-500 py-16 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12 border-b border-neutral-100 pb-12">
          
          <div className="md:col-span-4 flex flex-col gap-4">
            <span className="font-semibold text-lg tracking-tight text-neutral-800 underline underline-offset-4 decoration-brand-600 mb-2">
              AiMLTriage
            </span>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">
              An IRISSTAR Technologies platform. Lowering employee health insurance costs through licensed clinical triage.
            </p>
          </div>
          
          <div className="md:col-span-4">
             <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-4">UAE Office</h4>
             <address className="text-sm text-neutral-500 not-italic leading-relaxed space-y-1">
               <p>Level 20, 48 Burj Gate tower,</p>
               <p>Downtown Dubai, P.O. Box 22061</p>
               <p>Dubai, UAE</p>
               <p className="pt-2">
                 <a href="tel:+97145182632" className="hover:text-brand-600 transition-colors">+971 4 518 2632</a>
                 <span className="mx-2">|</span>
                 <a href="tel:+97142386786" className="hover:text-brand-600 transition-colors">+971 4 238 6786</a>
               </p>
             </address>
          </div>

          <div className="md:col-span-4">
             <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-4">Qatar Office</h4>
             <address className="text-sm text-neutral-500 not-italic leading-relaxed space-y-1">
               <p>Office 214/215, 2nd Floor,</p>
               <p>Regus D-Ring Building no 65, D-Ring Road,</p>
               <p>Old Airport, PO Box 32522, Doha, Qatar</p>
               <p className="pt-2">
                 <a href="tel:+97444231111" className="hover:text-brand-600 transition-colors">+974 4423 1111</a>
               </p>
             </address>
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest text-neutral-400">
            <Link to="/" className="hover:text-brand-600 transition-colors">Home</Link>
            <Link to="/platform" className="hover:text-brand-600 transition-colors">Platform</Link>
            <Link to="/compliance" className="hover:text-brand-600 transition-colors">Compliance</Link>
            <Link to="/about" className="hover:text-brand-600 transition-colors">About Us</Link>
          </div>
          
          <div className="text-xs font-bold tracking-widest uppercase text-neutral-300 text-center md:text-right">
            &copy; {new Date().getFullYear()} IRISSTAR Technologies.<br className="md:hidden" /> All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
