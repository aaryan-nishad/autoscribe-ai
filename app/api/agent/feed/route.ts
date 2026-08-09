import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
    try {
        const searchParams =
            request.nextUrl.searchParams;

        const agentId =
            searchParams.get("agentId");

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

        const requestedLimit =
            Number(
                searchParams.get("limit") ??
                    DEFAULT_LIMIT,
            );

        const limit =
            Number.isFinite(requestedLimit) &&
            requestedLimit > 0
                ? Math.min(
                      Math.floor(
                          requestedLimit,
                      ),
                      MAX_LIMIT,
                  )
                : DEFAULT_LIMIT;

        const cursor =
            searchParams.get("cursor");

        const posts =
            await prisma.publishedPost.findMany({
                where: {
                    agentId,

                    topic: {
                        status: "PUBLISHED",
                    },
                },

                orderBy: [
                    {
                        publishedAt: "desc",
                    },
                    {
                        id: "desc",
                    },
                ],

                take: limit + 1,

                ...(cursor
                    ? {
                          cursor: {
                              id: cursor,
                          },

                          skip: 1,
                      }
                    : {}),

                include: {
                    topic: true,
                    agent: true,
                },
            });

        const hasMore =
            posts.length > limit;

        const visiblePosts =
            hasMore
                ? posts.slice(0, limit)
                : posts;

        const nextCursor =
            hasMore
                ? visiblePosts[
                      visiblePosts.length - 1
                  ].id
                : null;

        return NextResponse.json({
            success: true,

            data: {
                posts:
                    visiblePosts.map(
                        (post) => ({
                            id: post.id,

                            createdAt:
                                post.publishedAt,

                            text:
                                post.text,

                            rationale:
                                post.rationale,

                            sources:
                                post.sources,

                            publishedAt:
                                post.publishedAt,

                            topic: {
                                id:
                                    post.topic.id,

                                title:
                                    post.topic.title,

                                summary:
                                    post.topic.summary,

                                sourceName:
                                    post.topic
                                        .sourceName,

                                sourceUrl:
                                    post.topic
                                        .sourceUrl,

                                url:
                                    post.topic.url,

                                publishedDate:
                                    post.topic
                                        .publishedDate,
                            },

                            agent: {
                                id:
                                    post.agent.id,

                                name:
                                    post.agent.name,

                                domain:
                                    post.agent
                                        .domain,
                            },
                        }),
                    ),

                pagination: {
                    limit,
                    hasMore,
                    nextCursor,
                },
            },
        });
    } catch (error) {
        console.error(
            "Agent feed request failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,

                error:
                    "Failed to load AutoScribe feed.",
            },
            {
                status: 500,
            },
        );
    }
}