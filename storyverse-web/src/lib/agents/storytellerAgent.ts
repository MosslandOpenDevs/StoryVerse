import { generateText, type LanguageModel } from "ai";
import { entrypoint, task } from "@langchain/langgraph";

export type StoryMedium = "Movie" | "History" | "Novel";

export interface StoryEndpoint {
  id: string;
  title: string;
  medium: StoryMedium;
  summary: string;
}

export interface StorytellerAgentInput {
  source: StoryEndpoint;
  target: StoryEndpoint;
  model?: LanguageModel;
}

export interface WhatIfScenario {
  title: string;
  bridge: string;
  timelineBeats: string[];
  risk: string;
}

type BridgeDraft = {
  source: StoryEndpoint;
  target: StoryEndpoint;
  bridge: string;
};

const DEFAULT_RISK =
  "Continuity drift may destabilize canonical timelines if unresolved.";

const createBridgeHypothesis = task(
  "create-bridge-hypothesis",
  async (input: StorytellerAgentInput): Promise<BridgeDraft> => {
    const fallbackBridge = `A relic from ${input.source.title} is discovered in ${input.target.title}, forcing both worlds into a shared conflict economy.`;

    if (!input.model) {
      return {
        source: input.source,
        target: input.target,
        bridge: fallbackBridge,
      };
    }

    const { text } = await generateText({
      model: input.model,
      system:
        "You are StorytellerAgent. Produce one concise What-If bridge sentence connecting two unrelated story nodes.",
      prompt: `
Node A: ${input.source.title} (${input.source.medium}) - ${input.source.summary}
Node B: ${input.target.title} (${input.target.medium}) - ${input.target.summary}
      `.trim(),
    });

    return {
      source: input.source,
      target: input.target,
      bridge: text.trim() || fallbackBridge,
    };
  },
);

const buildTimeline = task(
  "build-scenario-timeline",
  async (draft: BridgeDraft): Promise<WhatIfScenario> => {
    return {
      title: `What If ${draft.source.title} Met ${draft.target.title}?`,
      bridge: draft.bridge,
      timelineBeats: [
        `Inciting Event: a narrative signal links ${draft.source.title} to ${draft.target.title}.`,
        "Escalation: both worlds reinterpret the signal as an existential threat.",
        "Convergence: protagonists negotiate an uneasy alliance.",
        "Resolution: one shared myth survives and redefines both canons.",
      ],
      risk: DEFAULT_RISK,
    };
  },
);

const storytellerWorkflow = entrypoint(
  "storyteller-agent",
  async (input: StorytellerAgentInput): Promise<WhatIfScenario> => {
    const bridgeDraft = await createBridgeHypothesis(input);
    return buildTimeline(bridgeDraft);
  },
);

export async function storytellerAgent(
  input: StorytellerAgentInput,
): Promise<WhatIfScenario> {
  return storytellerWorkflow.invoke(input);
}
