import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const agentId =
            request.nextUrl.searchParams.get(
                "agentId",
            );

        if (!agentId) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "agentId query parameter is required.",
                },
                {
                    status: 400,
                },
            );
        }

        const agent =
            await prisma.agent.findUnique({
                where: {
                    id: agentId,
                },

                select: {
                    id: true,
                    name: true,
                    domain: true,
                    status: true,
                    isProcessing: true,
                    lastRunAt: true,
                    nextRunAt: true,
                },
            });

        if (!agent) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Agent not found.",
                },
                {
                    status: 404,
                },
            );
        }

        const lastRun =
            await prisma.schedulerLog.findFirst({
                where: {
                    agentId,
                },

                orderBy: {
                    startedAt: "desc",
                },

                select: {
                    id: true,
                    startedAt: true,
                    finishedAt: true,
                    topicsFound: true,
                    topicsEvaluated: true,
                    topicsRejected: true,
                    topicsSelected: true,
                    topicsPublished: true,
                    status: true,
                    error: true,
                },
            });

        const publishedCount =
            await prisma.publishedPost.count({
                where: {
                    agentId,
                },
            });

        return NextResponse.json({
            success: true,

            data: {
                agent,

                statistics: {
                    published:
                        publishedCount,
                },

                lastRun,
            },
        });
    } catch (error) {
        console.error(
            "Agent status request failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to load agent status.",
            },
            {
                status: 500,
            },
        );
    }
}