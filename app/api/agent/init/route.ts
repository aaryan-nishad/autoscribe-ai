import {
  NextResponse,
} from "next/server";

import {
  initializeAgent,
} from "../../../../services/agent/agent-service";

export async function POST() {
  try {
    const agent =
      await initializeAgent();

    return NextResponse.json(
      {
        success: true,

        agent: {
          id: agent.id,
          name: agent.name,
          domain: agent.domain,
          status: agent.status,

          persona: agent.persona
            ? {
                id:
                  agent.persona.id,

                writingStyle:
                  agent.persona.writingStyle,

                tone:
                  agent.persona.tone,

                audience:
                  agent.persona.audience,

                interests:
                  agent.persona.interests,

                opinions:
                  agent.persona.opinions,

                blacklist:
                  agent.persona.blacklist,

                systemPrompt:
                  agent.persona.systemPrompt,
              }
            : null,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Agent initialization failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to initialize AutoScribe agent.",
      },
      {
        status: 500,
      },
    );
  }
}