import { MousePointerClick, Cpu, Compass } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Pick Two Stories",
    description:
      "Choose any two stories from our curated catalog spanning movies, historical events, and novels.",
    icon: MousePointerClick,
    color: "text-neon-cyan",
    borderColor: "from-neon-cyan/60 to-transparent",
    glowHover: "hover:shadow-[0_0_25px_rgba(34,211,238,0.25)]",
  },
  {
    number: "02",
    title: "AI Builds the Bridge",
    description:
      "Our agentic GraphRAG engine synthesizes a narrative bridge connecting both worlds with timeline beats.",
    icon: Cpu,
    color: "text-neon-violet",
    borderColor: "from-neon-violet/60 to-transparent",
    glowHover: "hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]",
  },
  {
    number: "03",
    title: "Explore Connections",
    description:
      "Dive into the scenario, follow timeline beats, assess narrative risks, and discover neighbor stories.",
    icon: Compass,
    color: "text-neon-rose",
    borderColor: "from-neon-rose/60 to-transparent",
    glowHover: "hover:shadow-[0_0_25px_rgba(244,114,182,0.25)]",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative px-6 py-24"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-2xl tracking-wide text-cosmos-100 sm:text-3xl">
          How It Works
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          Three steps to bridge any two stories in the universe
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`group relative overflow-hidden rounded-2xl border border-cosmos-200/10 bg-panel/50 p-6 backdrop-blur-xl transition-all duration-300 ${step.glowHover}`}
              >
                {/* Top gradient border line */}
                <div
                  className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${step.borderColor}`}
                />

                {/* Background step number */}
                <span className="pointer-events-none absolute right-4 top-2 font-display text-6xl font-bold text-cosmos-200/5">
                  {step.number}
                </span>

                <div className="relative">
                  <div className="mb-4">
                    <Icon className={`h-8 w-8 ${step.color}`} />
                  </div>
                  <h3 className="font-display text-base tracking-wide text-cosmos-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
