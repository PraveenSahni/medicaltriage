import { ArrowRight, Calculator } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-20">
      <div className="grid lg:grid-cols-12 gap-0 min-h-[calc(100vh-5rem)]">
        
        {/* Content Column */}
        <div className="lg:col-span-7 px-8 py-16 lg:p-20 flex flex-col justify-center bg-neutral-50">
          <span className="inline-block text-brand-600 font-bold text-xs uppercase tracking-[0.3em] mb-4">
            Enterprise Clinical Solutions
          </span>
          <h1 className="text-5xl lg:text-7xl font-display leading-[1.05] text-neutral-900 mb-6">
            Lower Your Employee <br className="hidden lg:block" />
            <span className="italic text-brand-800 underline decoration-neutral-300">
              Insurance Costs
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-neutral-600 leading-relaxed mb-10 max-w-xl font-medium">
            A licensed nurse reviews every employee health call before it becomes a claim — so only real emergencies escalate to costly care.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <a 
              href="#demo"
              className="w-full sm:w-auto border-2 border-neutral-900 px-8 py-4 font-bold text-sm uppercase tracking-wider hover:bg-neutral-900 hover:text-white transition-all text-center inline-flex items-center justify-center gap-2"
            >
              Request a Demo
              <ArrowRight className="w-4 h-4" />
            </a>
            <div className="flex items-center gap-3 px-2 text-neutral-500 w-full sm:w-auto justify-center">
              <span className="h-px w-8 bg-neutral-300"></span>
              <span className="text-xs font-bold uppercase tracking-tighter text-neutral-500">Without Lowering Care Standards</span>
            </div>
          </div>
        </div>

        {/* Data & Visual Column */}
        <div className="lg:col-span-5 bg-neutral-900 text-white p-12 lg:p-20 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 pointer-events-none">
            <div className="text-[140px] font-display leading-none opacity-10 select-none">25%</div>
          </div>
          
          <div className="mt-auto relative z-10">
            <div className="mb-10">
              <h3 className="text-emerald-400 font-mono text-sm mb-4 tracking-widest">[ FINANCIAL IMPACT ]</h3>
              <p className="text-3xl font-light leading-snug">
                Targeting a <span className="text-emerald-400 font-bold">25% reduction</span> in your Insurance Claim Ratio (ICR) through expert diversion.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 border-l-2 border-emerald-500/30 pl-6 py-2">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2">No More Unnecessary ER Visits</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">Redirect routine cases to self-care or low-cost clinic pathways instantly.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-l-2 border-neutral-700 pl-6 py-2">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-2">Clinical Documentation</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">Auditable, defensible trails for every claim decision, ensuring provider transparency.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Feature Bar */}
      <div className="bg-white border-t border-b border-neutral-200 px-8 py-10 lg:px-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">01. Verification</span>
          <p className="text-xs font-bold text-neutral-800 leading-relaxed uppercase">Auto-verification via HRMS & IVR Integration</p>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">02. Intelligence</span>
          <p className="text-xs font-bold text-neutral-800 leading-relaxed uppercase">Evidence-Based Clinical Protocols</p>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">03. Clinical UI</span>
          <p className="text-xs font-bold text-neutral-800 leading-relaxed uppercase">Acuity-ordered Guided Questioning</p>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">04. Disposition</span>
          <p className="text-xs font-bold text-neutral-800 leading-relaxed uppercase">Bilingual (EN/AR) Auto-Handoff Notes</p>
        </div>
      </div>
    </section>
  );
}
