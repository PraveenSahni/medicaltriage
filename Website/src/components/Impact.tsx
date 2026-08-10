import { ShieldCheck, Stethoscope, FileSearch } from 'lucide-react';

export function Impact() {
  return (
    <section id="impact" className="py-24 bg-neutral-900 text-white relative overflow-hidden border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <span className="inline-block text-emerald-400 font-bold text-xs uppercase tracking-[0.3em] mb-6">
              Real Insurance Cost Savings
            </span>
            <h2 className="text-4xl md:text-5xl font-display leading-tight mb-8">
              The right care, at the right time. <br/>
              <span className="italic text-emerald-400 underline decoration-neutral-600">No more, no less.</span>
            </h2>
            <p className="text-lg text-neutral-400 mb-12 leading-relaxed">
              By putting a licensed clinical triage layer in front of every employee health call, AiMLTriage makes sure each case goes to the correct level of care. The result: fewer unnecessary high-cost claims and a stronger position at renewal.
            </p>

            <div className="space-y-8">
              <div className="flex gap-6 border-l-2 border-emerald-500/30 pl-6 py-2">
                <div className="flex-shrink-0 mt-1">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2">Safety First</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">Genuine emergencies are still escalated to the ER immediately and correctly — clinical safety is never compromised.</p>
                </div>
              </div>
              <div className="flex gap-6 border-l-2 border-brand-500/30 pl-6 py-2">
                <div className="flex-shrink-0 mt-1">
                  <Stethoscope className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-brand-400 mb-2">Safe Redirection</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">Conditions that don't need a hospital visit are safely redirected to self-care guidance, teleconsult, or a lower-cost clinic pathway, backed by real clinical protocols, not guesswork.</p>
                </div>
              </div>
              <div className="flex gap-6 border-l-2 border-neutral-500/30 pl-6 py-2">
                <div className="flex-shrink-0 mt-1">
                  <FileSearch className="w-6 h-6 text-neutral-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-2">Defensible Documentation</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">Every decision is documented and auditable, giving your insurer a clear, defensible reason behind every claim (and every case that didn't need to become one).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800/50 border border-neutral-700 p-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-400 mb-6">Targeted ICR Reduction</h3>
            <p className="text-neutral-400 mb-10 leading-relaxed text-sm">
              Our strategic objective is to help enterprise clients achieve a measurable reduction in their Insurance Claim Ratio (ICR).
            </p>
            
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-7xl md:text-8xl font-display text-white">25%</span>
              <span className="text-sm font-bold uppercase tracking-widest text-emerald-400">Target Reduction</span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              *Measured directly through avoidable ER and urgent care diversions to lower-cost pathways.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
