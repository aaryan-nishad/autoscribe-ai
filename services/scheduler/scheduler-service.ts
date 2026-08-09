import { prisma } from "../../lib/prisma";

const DEFAULT_APP_URL = "http://localhost:3000";

interface AgentRunResponse {
    success: boolean;

    run?: {
        durationMs: number;

        discovery?: {
            rawCandidates?: number;
            uniqueCandidates?: number;
            evaluatedCandidates?: number;
        };

        results?: Array<{
            decision?: string;
        }>;

        summary?: {
            published?: number;
            rejected?: number;
            errors?: number;
        };
    };

    error?: string;
}

export async function runSchedulerOnce() {
    /*
     * Find the AutoScribe agent.
     */
    const agent = await prisma.agent.findFirst({
        where: {
            name: "AutoScribe",
        },
    });

    if (!agent) {
        throw new Error(
            "AutoScribe agent does not exist. Initialize the agent first.",
        );
    }

    /*
     * Scheduler only runs ACTIVE agents.
     */
    if (agent.status !== "ACTIVE") {
        return {
            skipped: true,
            reason: `Agent status is ${agent.status}.`,
        };
    }

    /*
     * Check whether the agent is already processing.
     *
     * updateMany is intentionally used here because the
     * WHERE condition makes this an atomic lock.
     */
    const lock = await prisma.agent.updateMany({
        where: {
            id: agent.id,
            isProcessing: false,
        },

        data: {
            isProcessing: true,
        },
    });

    /*
     * Another scheduler invocation already owns the lock.
     */
    if (lock.count === 0) {
        return {
            skipped: true,
            reason: "Agent is already processing.",
        };
    }

    const startedAt = new Date();

    let schedulerLogId: string | null = null;

    try {
        /*
         * Create scheduler execution log.
         */
        const schedulerLog =
            await prisma.schedulerLog.create({
                data: {
                    agentId: agent.id,
                    startedAt,
                    status: "RUNNING",
                },
            });

        schedulerLogId = schedulerLog.id;

        /*
         * Call the existing autonomous pipeline.
         *
         * We deliberately reuse /api/agent/run instead of
         * duplicating discovery/editorial/publishing logic.
         */
        const appUrl =
            process.env.APP_URL ??
            DEFAULT_APP_URL;

        const response = await fetch(
            `${appUrl}/api/agent/run`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },

                signal: AbortSignal.timeout(
                    5 * 60 * 1000,
                ),
            },
        );
        const text = await response.text();

        let data: AgentRunResponse;

        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `Agent run returned invalid JSON: ${text}`,
            );
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.error ??
                `Agent run failed with HTTP ${response.status}.`,
            );
        }

        const run = data.run;

        if (!run) {
            throw new Error(
                "Agent run response did not contain run data.",
            );
        }

        const results =
            run.results ?? [];

        const published =
            run.summary?.published ?? 0;

        const rejected =
            run.summary?.rejected ?? 0;

        const errors =
            run.summary?.errors ?? 0;

        const selected =
            results.filter(
                (result) =>
                    result.decision ===
                    "PUBLISHED" ||
                    result.decision ===
                    "QUALITY_REJECTED",
            ).length;

        const finishedAt =
            new Date();

        /*
         * Calculate the next scheduled run.
         */
        const nextRunAt =
            new Date(
                finishedAt.getTime() +
                agent.publishIntervalMinutes *
                60 *
                1000,
            );

        /*
         * Update scheduler log.
         */
        await prisma.schedulerLog.update({
            where: {
                id: schedulerLogId,
            },

            data: {
                finishedAt,

                topicsFound:
                    run.discovery
                        ?.uniqueCandidates ??
                    0,

                topicsEvaluated:
                    run.discovery
                        ?.evaluatedCandidates ??
                    results.length,

                topicsRejected:
                    rejected,

                topicsSelected:
                    selected,

                topicsPublished:
                    published,

                status:
                    errors > 0
                        ? "FAILED"
                        : "SUCCESS",

                error:
                    errors > 0
                        ? `${errors} candidate(s) failed during the autonomous run.`
                        : null,

                discoveryDurationMs:
                    null,

                editorialDurationMs:
                    null,

                publishingDurationMs:
                    run.durationMs,
            },
        });

        /*
         * Release the processing lock and schedule
         * the next execution.
         */
        await prisma.agent.update({
            where: {
                id: agent.id,
            },

            data: {
                isProcessing: false,
                lastRunAt: finishedAt,
                nextRunAt,
            },
        });

        return {
            skipped: false,

            agent: {
                id: agent.id,
                name: agent.name,
            },

            scheduler: {
                startedAt,
                finishedAt,
                nextRunAt,
            },

            run,
        };
    } catch (error) {
        const finishedAt =
            new Date();

        const errorMessage =
            error instanceof DOMException &&
                error.name === "TimeoutError"
                ? "Agent run timed out after 5 minutes."
                : error instanceof Error
                    ? error.message
                    : String(error);

        /*
         * Never leave the scheduler lock stuck.
         */
        if (schedulerLogId) {
            await prisma.schedulerLog.update({
                where: {
                    id: schedulerLogId,
                },

                data: {
                    finishedAt,
                    status: "FAILED",
                    error: errorMessage,
                },
            });
        }

        await prisma.agent.update({
            where: {
                id: agent.id,
            },

            data: {
                isProcessing: false,

                /*
                 * Retry on the next scheduler tick.
                 */
                nextRunAt: finishedAt,
            },
        });

        throw error;
    }
}