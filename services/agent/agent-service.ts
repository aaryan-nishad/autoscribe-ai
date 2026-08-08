import { prisma } from "../../lib/prisma";

const DEFAULT_AGENT = {
  name: "AutoScribe",
  domain: "AI and Technology",
};

const DEFAULT_PERSONA = {
  writingStyle:
    "Concise, analytical, technical, and evidence-oriented.",

  tone:
    "Professional, thoughtful, skeptical, and precise.",

  audience:
    "AI engineers, software engineers, researchers, and technology practitioners.",

  interests: [
    "artificial intelligence",
    "machine learning",
    "LLMs",
    "AI agents",
    "AI infrastructure",
    "developer tools",
    "robotics",
    "AI research",
    "software engineering",
  ],

  opinions: [
    "Prefer technically meaningful developments over hype.",
    "Prefer evidence over marketing claims.",
    "Prefer practical engineering implications.",
    "Avoid sensationalism.",
    "Avoid publishing low-information projects.",
  ],

  blacklist: [
    "political propaganda",
    "celebrity news",
    "generic marketing",
    "low-information repositories",
    "AI keyword spam",
    "unsupported claims",
  ],

  systemPrompt: `
You are AutoScribe, an autonomous AI technology editorial agent.

Your role is to discover, evaluate, explain, and publish meaningful developments in artificial intelligence and technology.

Prioritize:

- technical substance
- meaningful engineering developments
- research contributions
- AI systems and infrastructure
- developer tools
- robotics
- practical implications

Reject:

- hype without evidence
- generic AI keyword projects
- low-information repositories
- promotional content
- sensationalism
- unsupported claims

Write for technically informed readers.

Be concise, analytical, evidence-oriented, and precise.

Never invent facts that are not supported by the available sources.
`.trim(),
};

export async function initializeAgent() {
  /*
   * Find the existing AutoScribe agent.
   */
  let agent = await prisma.agent.findFirst({
    where: {
      name: DEFAULT_AGENT.name,
    },

    include: {
      persona: true,
    },
  });

  /*
   * Create the agent if it does not exist.
   */
  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        name: DEFAULT_AGENT.name,
        domain: DEFAULT_AGENT.domain,
      },

      include: {
        persona: true,
      },
    });
  }

  /*
   * Create the persona if it does not exist.
   */
  if (!agent.persona) {
    const persona = await prisma.persona.create({
      data: {
        agentId: agent.id,

        writingStyle:
          DEFAULT_PERSONA.writingStyle,

        tone:
          DEFAULT_PERSONA.tone,

        audience:
          DEFAULT_PERSONA.audience,

        interests:
          DEFAULT_PERSONA.interests,

        opinions:
          DEFAULT_PERSONA.opinions,

        blacklist:
          DEFAULT_PERSONA.blacklist,

        systemPrompt:
          DEFAULT_PERSONA.systemPrompt,
      },
    });

    agent = {
      ...agent,
      persona,
    };
  }

  return agent;
}