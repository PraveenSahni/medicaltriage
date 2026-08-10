import { Database, Lock, Users, Server } from 'lucide-react';

export function Compliance() {
  return (
    <section className="py-24 bg-neutral-900 text-white border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="grid sm:grid-cols-2 gap-0 border-t border-l border-neutral-700">
              <div className="border-r border-b border-neutral-700 p-10 relative">
                <Database className="w-8 h-8 text-emerald-400 mb-6" strokeWidth={1.5} />
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Strict Boundaries & Audits</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Multi-tenant architecture with strict organizational data boundaries and full audit trails on every clinical decision.
                </p>
              </div>
              <div className="border-r border-b border-neutral-700 p-10 relative">
                <Lock className="w-8 h-8 text-emerald-400 mb-6" strokeWidth={1.5} />
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Access Control</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Role-based access control across 19+ distinct staff roles for precise permission management and data access.
                </p>
              </div>
              <div className="border-r border-b border-neutral-700 p-10 relative">
                <Users className="w-8 h-8 text-emerald-400 mb-6" strokeWidth={1.5} />
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Open Integration</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Connects seamlessly to any health system, HRMS, or clinical platform your organization already runs.
                </p>
              </div>
              <div className="border-r border-b border-neutral-700 p-10 relative">
                <Server className="w-8 h-8 text-emerald-400 mb-6" strokeWidth={1.5} />
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Deployment Flexibility</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Regionally hosted by default, or fully hosted within your enterprise's own private cloud environment.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2">
            <span className="inline-block text-emerald-400 font-bold text-xs uppercase tracking-[0.3em] mb-6">
              Data Residency & Compliance
            </span>
            <h2 className="text-4xl md:text-5xl font-display leading-tight mb-8">
              Your data stays <br/>
              <span className="italic text-emerald-400 underline decoration-neutral-600">within the region</span>
            </h2>
            <p className="text-lg text-neutral-400 leading-relaxed mb-8">
              We understand the strict regulatory environment for health and employee data. By default, AiMLTriage is hosted entirely on regional cloud infrastructure with no data leaving the Middle East. For stricter internal requirements, it can be deployed <strong>directly on your own enterprise private cloud</strong>, giving you complete control over your data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
