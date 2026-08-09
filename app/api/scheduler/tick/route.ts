import { NextResponse } from "next/server";

import {
    runSchedulerOnce,
} from "../../../../services/scheduler";

export const dynamic = "force-dynamic";

function isAuthorized(
    request: Request,
): boolean {
    const cronSecret =
        process.env.CRON_SECRET;

    if (!cronSecret) {
        return false;
    }

    const authorization =
        request.headers.get(
            "authorization",
        );

    return (
        authorization ===
        `Bearer ${cronSecret}`
    );
}

async function handleSchedulerTick(
    request: Request,
) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            {
                success: false,
                error: "Unauthorized",
            },
            {
                status: 401,
            },
        );
    }

    try {
        const result =
            await runSchedulerOnce();

        return NextResponse.json({
            success: true,
            scheduler: result,
        });
    } catch (error) {
        console.error(
            "Scheduler tick failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            {
                status: 500,
            },
        );
    }
}

export async function GET(
    request: Request,
) {
    return handleSchedulerTick(request);
}

export async function POST(
    request: Request,
) {
    return handleSchedulerTick(request);
}