import { 
  BadgeDollarSign, 
  BookOpenCheck, 
  UserCog, 
  Network, 
  Plane, 
  History, 
  FileText, 
  LayoutDashboard,
  Server
} from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: BadgeDollarSign,
      title: 'Cost-Aware Routing',
      description: 'Every case is triaged against licensed clinical criteria — landing on the lowest-cost pathway that\'s still clinically safe.'
    },
    {
      icon: BookOpenCheck,
      title: 'Evidence-Based Protocols',
      description: 'Built on internationally recognized, evidence-based clinical triage guidelines — the same rigor used by professional nurse triage lines worldwide.'
    },
    {
      icon: UserCog,
      title: 'Nurse-in-the-Loop',
      description: 'The system suggests — the nurse decides. Every guideline match is reviewable and overridable by a licensed clinician.'
    },
    {
      icon: Network,
      title: 'Seamless Integrations',
      description: 'Connects to HRMS, IVR, EMR/EHR platforms, and other clinical or workforce systems your organization already uses.'
    },
    {
      icon: Plane,
      title: 'Aviation Overlays',
      description: 'Purpose-built for aviation workforces — automatic fit-to-fly assessments and routing to the right clinic or hospital.'
    },
    {
      icon: History,
      title: 'Audit-Ready by Design',
      description: 'Every question, answer, and disposition is logged — a defensible, documented trail your insurer and finance team can rely on.'
    },
    {
      icon: FileText,
      title: 'Auto-Compiled Notes',
      description: 'Bilingual (English/Arabic) clinical notes generated the moment a disposition is reached.'
    },
    {
      icon: LayoutDashboard,
      title: 'Service Manager Dash',
      description: 'Real-time, read-only visibility into every call in the queue — wait times, active cases, safety alerts.'
    },
    {
      icon: Server,
      title: 'Deploy On Your Own Infra',
      description: 'Run entirely on your enterprise\'s own private/internal cloud — full data control, behind your own security perimeter.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block text-brand-600 font-bold text-xs uppercase tracking-[0.3em] mb-6">
            Platform Capabilities
          </span>
          <h2 className="text-4xl md:text-5xl font-display leading-tight text-neutral-900 mb-6">
            Enterprise-grade capabilities <br/>
            <span className="italic text-brand-800 underline decoration-neutral-300">out of the box</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-neutral-200 bg-white">
          {features.map((feature, index) => (
            <div key={index} className="p-8 border-r border-b border-neutral-200 hover:bg-neutral-50 transition-colors group">
              <div className="mb-6 text-neutral-400 group-hover:text-brand-600 transition-colors">
                <feature.icon className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-3">{feature.title}</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
