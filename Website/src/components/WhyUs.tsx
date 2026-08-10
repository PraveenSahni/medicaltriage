import { Check } from 'lucide-react';

export function WhyUs() {
  const reasons = [
    {
      title: 'Directly lowers your health insurance costs',
      description: 'The core financial case for enterprise adoption.'
    },
    {
      title: 'Built for real enterprise operations',
      description: 'Not a generic telehealth template.'
    },
    {
      title: 'Evidence-based, not invented, clinical content',
      description: 'Every protocol is grounded in recognized clinical practice.'
    },
    {
      title: 'Speed without sacrificing safety',
      description: 'Guided by the same acuity-first logic used in professional nurse triage lines.'
    },
    {
      title: 'Integrates with what you already have',
      description: 'HRMS, IVR, EMR/EHR, or any other health system in your stack.'
    },
    {
      title: 'Deploy your way',
      description: 'Hosted regionally by us, or fully within your own enterprise private cloud.'
    }
  ];

  return (
    <section className="py-24 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block text-brand-600 font-bold text-xs uppercase tracking-[0.3em] mb-6">
            The Advantage
          </span>
          <h2 className="text-4xl md:text-5xl font-display leading-tight text-neutral-900 mb-6">
            Why <span className="italic text-brand-800 underline decoration-neutral-300">AiMLTriage</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-0 border-t border-l border-neutral-200 max-w-5xl mx-auto">
          {reasons.map((reason, index) => (
            <div key={index} className="p-8 border-r border-b border-neutral-200 hover:bg-neutral-50 transition-colors flex gap-6">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-brand-700 text-white flex items-center justify-center">
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-2">{reason.title}</h3>
                <p className="text-neutral-600 leading-relaxed text-sm">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
