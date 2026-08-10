import { prisma } from "../../lib/prisma";

const DEFAULT_APP_URL = "http://localhost:3000";

/*
 * A scheduler run normally completes within a few minutes.
 *
 * If the processing lock is older than this threshold,
 * assume the previous invocation crashed or timed out and
 * allow the next scheduler tick to recover it.
 */
const STALE_LOCK_MINUTES = 15;

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
     * Use a timestamp as the lock ownership token.
     *
     * This allows us to distinguish:
     * - the current run
     * - an old/stale run
     * - a newer run that reclaimed a stale lock
     */
    const lockAcquiredAt = new Date();

    const staleBefore = new Date(
        lockAcquiredAt.getTime() -
        STALE_LOCK_MINUTES * 60 * 1000,
    );

    /*
     * Acquire the processing lock atomically.
     *
     * Normal case:
     *     isProcessing = false
     *
     * Recovery case:
     *     isProcessing = true
     *     but processingStartedAt is older than
     *     STALE_LOCK_MINUTES.
     *
     * The timestamp is updated whenever this invocation
     * successfully acquires the lock.
     */
    const lock = await prisma.agent.updateMany({
        where: {
            id: agent.id,

            OR: [
                {
                    isProcessing: false,
                },
                {
                    isProcessing: true,
                    processingStartedAt: {
                        lt: staleBefore,
                    },
                },
                {
                    isProcessing: true,
                    processingStartedAt: null,
                },
            ],
        },

        data: {
            isProcessing: true,
            processingStartedAt: lockAcquiredAt,
        },
    });

    /*
     * Another scheduler invocation still owns a valid lock.
     */
    if (lock.count === 0) {
        return {
            skipped: true,
            reason: "Agent is already processing.",
        };
    }

    const startedAt = lockAcquiredAt;

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
         * Release the lock ONLY if this invocation still owns it.
         *
         * This is important when a stale lock has been recovered.
         * An old invocation must never be allowed to clear the
         * lock belonging to a newer invocation.
         */
        await prisma.agent.updateMany({
            where: {
                id: agent.id,
                processingStartedAt:
                    lockAcquiredAt,
            },

            data: {
                isProcessing: false,
                processingStartedAt: null,
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
         * Update scheduler log when possible.
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

        /*
         * Release the lock ONLY if this invocation still owns it.
         *
         * If this was a stale invocation that was already replaced
         * by a newer run, this update affects zero rows and therefore
         * cannot interrupt the newer run.
         */
        await prisma.agent.updateMany({
            where: {
                id: agent.id,
                processingStartedAt:
                    lockAcquiredAt,
            },

            data: {
                isProcessing: false,
                processingStartedAt: null,

                /*
                 * Retry on the next scheduler tick.
                 */
                nextRunAt: finishedAt,
            },
        });

        throw error;
    }
}