import type { StoryNodeContext } from "./navigatorAgent";

export type StoryCatalogItem = StoryNodeContext & {
  aliases: string[];
};

/** The original 8 hand-curated stories. Always available even without Neo4j. */
export const SEED_CATALOG: StoryCatalogItem[] = [
  {
    id: "sherlock-holmes",
    title: "Sherlock Holmes",
    medium: "Novel",
    summary:
      "Victorian-era detective canon centered on forensic deduction, logic, and criminal networks.",
    aliases: ["sherlock", "holmes", "arthur conan doyle", "셜록 홈즈"],
  },
  {
    id: "star-wars",
    title: "Star Wars",
    medium: "Movie",
    summary:
      "Space-opera saga of empire, rebellion, mystic force traditions, and dynastic conflict.",
    aliases: ["sw", "jedi", "skywalker", "starwars", "스타워즈", "스타 워즈"],
  },
  {
    id: "cleopatra",
    title: "Cleopatra",
    medium: "History",
    summary:
      "Hellenistic ruler navigating Roman power struggles, propaganda warfare, and imperial succession.",
    aliases: ["queen cleopatra", "ptolemaic egypt", "egyptian queen", "클레오파트라"],
  },
  {
    id: "blade-runner",
    title: "Blade Runner",
    medium: "Movie",
    summary:
      "Neo-noir future where synthetic humans challenge identity, memory, and moral jurisdiction.",
    aliases: ["replicant", "deckard", "blade runner 2049", "블레이드 러너", "블레이드러너"],
  },
  {
    id: "dune",
    title: "Dune",
    medium: "Novel",
    summary:
      "Feudal interstellar politics shaped by ecology, prophecy, insurgency, and resource monopolies.",
    aliases: ["arrakis", "atreides", "fremen", "듄"],
  },
  {
    id: "roman-empire",
    title: "Roman Empire",
    medium: "History",
    summary:
      "Transcontinental imperial system driven by military expansion, law, civic administration, and succession crises.",
    aliases: ["rome", "caesar", "senate", "imperial rome", "로마 제국"],
  },
  {
    id: "napoleon",
    title: "Napoleon Bonaparte",
    medium: "History",
    summary:
      "Post-revolutionary military leader whose campaigns reshaped statecraft, warfare, and legal codification.",
    aliases: ["napoleon bonaparte", "french empire", "나폴레옹", "나폴레옹 보나파르트"],
  },
  {
    id: "lord-of-the-rings",
    title: "The Lord of the Rings",
    medium: "Novel",
    summary:
      "Epic mythic war narrative exploring power corruption, fellowship bonds, and civilizational memory.",
    aliases: ["lotr", "middle earth", "gandalf", "sauron", "반지의 제왕"],
  },
];
