import { NextResponse } from "next/server";

import {
    runSchedulerOnce,
} from "../../../../services/scheduler";

export async function POST() {
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