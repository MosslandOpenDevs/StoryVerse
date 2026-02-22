import Link from "next/link";
import { STORY_CATALOG } from "@/lib/agents/catalog";
import { Badge } from "@/components/ui/badge";
import type { StoryMedium } from "@/lib/agents/navigatorAgent";

const DOMAIN_BORDER_COLORS: Record<StoryMedium, string> = {
  Movie: "from-domain-movie to-transparent",
  History: "from-domain-history to-transparent",
  Novel: "from-domain-novel to-transparent",
};

const DOMAIN_HOVER_SHADOWS: Record<StoryMedium, string> = {
  Movie: "hover:shadow-movie",
  History: "hover:shadow-history",
  Novel: "hover:shadow-novel",
};

const DOMAIN_BG_RADIALS: Record<StoryMedium, string> = {
  Movie: "bg-[radial-gradient(circle_at_50%_0%,rgba(96,165,250,0.06),transparent_70%)]",
  History: "bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.06),transparent_70%)]",
  Novel: "bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.06),transparent_70%)]",
};

export function CatalogPreviewSection() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-2xl tracking-wide text-cosmos-100 sm:text-3xl">
          Story Catalog
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          Eight foundational stories waiting to be connected
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STORY_CATALOG.map((story) => (
            <Link
              key={story.id}
              href={`/universe?story=${story.id}`}
              className={`group relative overflow-hidden rounded-2xl border border-cosmos-200/10 bg-panel/50 p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${DOMAIN_HOVER_SHADOWS[story.medium]} ${DOMAIN_BG_RADIALS[story.medium]}`}
            >
              {/* Top gradient border strip */}
              <div
                className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${DOMAIN_BORDER_COLORS[story.medium]}`}
              />

              <div className="relative">
                <Badge domain={story.medium} className="mb-3">
                  {story.medium}
                </Badge>
                <h3 className="font-display text-sm tracking-wide text-cosmos-100">
                  {story.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                  {story.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
