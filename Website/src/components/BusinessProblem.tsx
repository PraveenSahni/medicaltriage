import { AlertTriangle, TrendingUp, Wallet } from 'lucide-react';

export function BusinessProblem() {
  return (
    <section id="problem" className="py-24 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mb-20">
          <span className="inline-block text-brand-600 font-bold text-xs uppercase tracking-[0.3em] mb-6">
            The Core Challenge
          </span>
          <h2 className="text-4xl md:text-5xl font-display leading-tight text-neutral-900 mb-8">
            The real driver of healthcare inflation isn't illness. <br />
            <span className="italic text-brand-800 underline decoration-neutral-300">It's unnecessary escalation.</span>
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed font-medium max-w-2xl">
            Employee health insurance is one of the largest and fastest-growing costs for enterprises across the GCC. But a major portion of that spend is completely avoidable.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-0 border-t border-l border-neutral-200">
          <div className="p-10 bg-white border-r border-b border-neutral-200 relative group hover:bg-neutral-50 transition-colors">
            <div className="mb-8 text-neutral-400 group-hover:text-brand-600 transition-colors">
              <TrendingUp className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-4">Direct Premium Impact</h3>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Every avoidable ER visit and unnecessary urgent-care claim adds directly to your company's insurance costs — driving up your renewal premiums year after year.
            </p>
          </div>

          <div className="p-10 bg-white border-r border-b border-neutral-200 relative group hover:bg-neutral-50 transition-colors">
            <div className="mb-8 text-neutral-400 group-hover:text-brand-600 transition-colors">
              <AlertTriangle className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-4">The Trust Gap</h3>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Employees go straight to the ER or book full clinic visits for self-limiting issues simply because there is no fast, trusted, professional alternative available when they feel sick.
            </p>
          </div>

          <div className="p-10 bg-neutral-900 text-white border-r border-b border-neutral-900 relative group">
            <div className="mb-8 text-emerald-400">
              <Wallet className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-4">The Solution</h3>
            <p className="text-neutral-400 leading-relaxed text-sm">
              AiMLTriage exists to fix exactly this. By intervening before the claim is generated, we ensure employees get the right level of care without the default expensive ER visit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
