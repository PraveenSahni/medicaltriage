import { UserCheck, FileCode2, MessagesSquare, Send } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: UserCheck,
      title: 'Caller Identity & Reason',
      description: "Integrated with your HRMS and IVR. The caller is verified — age, gender, role — the instant the call lands. No manual lookup. The reason for the call is captured as audio and auto-transcribed for the nurse.",
    },
    {
      icon: FileCode2,
      title: 'Guideline Matching',
      description: 'The system searches a licensed clinical protocol library and instantly surfaces the best-matching guideline with a confidence score, plus alternate candidates — the nurse always has final say and can override.',
    },
    {
      icon: MessagesSquare,
      title: 'Guided Questioning',
      description: 'Structured, acuity-ordered questions rule out the most dangerous condition first, then work down to routine self-care. The first "Yes" locks in the correct outcome.',
    },
    {
      icon: Send,
      title: 'Disposition & Handoff',
      description: 'A clear, color-coded disposition (Emergency / Urgent / Routine / Self-care) with routing guidance, care advice, and an auto-compiled clinical handoff note ready to integrate with any downstream health system.',
    }
  ];

  return (
    <section id="workflow" className="py-24 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block text-brand-600 font-bold text-xs uppercase tracking-[0.3em] mb-6">
            Clinical Operations
          </span>
          <h2 className="text-4xl md:text-5xl font-display leading-tight text-neutral-900 mb-6">
            A seamless, 4-step triage workflow
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed font-medium">
            Speed without sacrificing safety. Most calls triage in minutes, guided by the same acuity-first logic used in professional nurse triage lines globally.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-neutral-200">
          {steps.map((step, index) => (
            <div key={index} className="p-8 bg-white border-r border-b border-neutral-200 relative hover:bg-neutral-50 transition-colors group">
              <div className="mb-6 flex justify-between items-start">
                <div className="text-neutral-400 group-hover:text-brand-600 transition-colors">
                  <step.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">
                  0{index + 1}
                </span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-4">{step.title}</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
