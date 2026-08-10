import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import React, { useState } from 'react';

type ViewState = 'default' | 'demo';

const DEMO_REQUEST_RECIPIENTS = ['rishma@irisstar.tech', 'praveen@irisstar.tech'];

export function CTA() {
  const [view, setView] = useState<ViewState>('default');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const company = formData.get('company');
    const employees = formData.get('employees');

    const subject = `Demo Request: ${company} (${firstName} ${lastName})`;
    const body = [
      `Name: ${firstName} ${lastName}`,
      `Work Email: ${email}`,
      `Company: ${company}`,
      `Number of Employees: ${employees}`
    ].join('\n');

    const mailtoUrl = `mailto:${DEMO_REQUEST_RECIPIENTS.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    setSubmitted(true);
  };

  const closeView = () => {
    setView('default');
    setSubmitted(false);
  };

  return (
    <section id="demo" className="py-24 bg-brand-700 relative overflow-hidden border-t border-brand-800">
      <div className="absolute inset-0 pattern-grid-lg text-brand-800/30" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {view === 'default' && (
          <>
            <span className="inline-block text-white font-bold text-xs uppercase tracking-[0.3em] mb-6">
              Take Action
            </span>
            <h2 className="text-4xl md:text-6xl font-display leading-tight text-white mb-6">
              See the savings for <span className="italic underline decoration-brand-500">yourself.</span>
            </h2>
            <p className="text-xl text-brand-100 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
              Book a walkthrough with our team and see how a documented triage layer translates directly into lower insurance costs — without adding friction for your employees.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => setView('demo')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 text-sm font-bold uppercase tracking-widest text-brand-900 bg-white hover:bg-neutral-100 transition-all shadow-xl shadow-brand-900/20"
              >
                Request a Demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {view === 'demo' && (
          <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto text-left relative shadow-2xl">
            <button 
              onClick={closeView}
              className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display font-bold text-neutral-900 mb-4">Almost there</h3>
                <p className="text-neutral-600 mb-8">
                  We've opened your email app with your request pre-filled. Just hit send and our team will be in touch shortly to schedule your demo.
                </p>
                <button 
                  onClick={closeView}
                  className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold uppercase tracking-widest text-white bg-brand-700 hover:bg-brand-800 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-display font-bold text-neutral-900 mb-2">Request a Demo</h3>
                <p className="text-neutral-600 mb-8">Fill out the form below and we'll get back to you to schedule a walkthrough.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="firstName" className="block text-xs font-bold uppercase tracking-widest text-neutral-700">First Name</label>
                      <input required type="text" id="firstName" name="firstName" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lastName" className="block text-xs font-bold uppercase tracking-widest text-neutral-700">Last Name</label>
                      <input required type="text" id="lastName" name="lastName" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-neutral-700">Work Email</label>
                    <input required type="email" id="email" name="email" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="company" className="block text-xs font-bold uppercase tracking-widest text-neutral-700">Company Name</label>
                    <input required type="text" id="company" name="company" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="employees" className="block text-xs font-bold uppercase tracking-widest text-neutral-700">Number of Employees</label>
                    <select required id="employees" name="employees" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors">
                      <option value="">Select an option</option>
                      <option value="1-500">1 - 500</option>
                      <option value="501-2000">501 - 2,000</option>
                      <option value="2001-5000">2,001 - 5,000</option>
                      <option value="5000+">5,000+</option>
                    </select>
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white bg-brand-700 hover:bg-brand-800 transition-colors shadow-lg"
                    >
                      Submit Request
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
