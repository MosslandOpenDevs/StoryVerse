"use client";

interface TimelineBeatsProps {
  beats: string[];
}

export function TimelineBeats({ beats }: TimelineBeatsProps) {
  if (beats.length === 0) return null;

  return (
    <div className="rounded-2xl border border-cosmos-200/15 bg-panel/60 p-5 backdrop-blur-xl">
      <h4 className="mb-4 font-display text-xs tracking-wider text-cosmos-200/60 uppercase">
        Timeline Beats
      </h4>
      <div className="relative space-y-0">
        {beats.map((beat, index) => (
          <div
            key={index}
            className="animate-fade-in relative flex gap-3 pb-4 last:pb-0"
            style={{ animationDelay: `${index * 150}ms`, animationFillMode: "backwards" }}
          >
            {/* Vertical line */}
            {index < beats.length - 1 && (
              <div className="absolute left-[5px] top-3 h-full w-px bg-gradient-to-b from-neon-cyan/40 to-transparent" />
            )}
            {/* Dot */}
            <div className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-neon-cyan/60 bg-cosmos-950 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
            {/* Text */}
            <p className="text-sm leading-relaxed text-cosmos-200/85">{beat}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
