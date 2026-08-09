"use client";

import { useEffect, useState } from "react";



const AGENT_ID = "cmslmwwt0000004iamtqysftj";

type Post = {
  id: string;
  text: string;
  rationale: string;
  sources: string[];
  createdAt: string;
  publishedAt: string;
  topic: {
    title: string;
    summary: string;
    sourceName: string;
    url: string;
  };
};

type FeedResponse = {
  success: boolean;
  data: {
    posts: Post[];
    pagination: {
      hasMore: boolean;
      nextCursor: string | null;
    };
  };
};

type AgentStatus = {
  id: string;
  name: string;
  domain: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  isProcessing: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

type LastRun = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  topicsFound: number;
  topicsEvaluated: number;
  topicsRejected: number;
  topicsSelected: number;
  topicsPublished: number;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";
  error: string | null;
};

type StatusResponse = {
  success: boolean;
  data: {
    agent: AgentStatus;
    statistics: {
      published: number;
    };
    lastRun: LastRun | null;
  };
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] =
    useState<StatusResponse["data"] | null>(null);


  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(manual = false) {
    try {
      setError("");

      if (manual) {
        setRefreshing(true);
      }

      const [feedResponse, statusResponse] =
        await Promise.all([
          fetch(
            `/api/agent/feed?agentId=${AGENT_ID}&limit=20`,
            {
              cache: "no-store",
            },
          ),

          fetch(
            `/api/agent/status?agentId=${AGENT_ID}`,
            {
              cache: "no-store",
            },
          ),
        ]);

      if (
        !feedResponse.ok ||
        !statusResponse.ok
      ) {
        throw new Error(
          "Failed to load AutoScribe dashboard.",
        );
      }

      const feedData: FeedResponse =
        await feedResponse.json();

      const statusData: StatusResponse =
        await statusResponse.json();

      if (
        !feedData.success ||
        !statusData.success
      ) {
        throw new Error(
          "AutoScribe dashboard request failed.",
        );
      }

      setPosts(feedData.data.posts);
      setStatus(statusData.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);

      if (manual) {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval =
      setInterval(
        loadDashboard,
        60_000,
      );

    return () => {
      clearInterval(interval);
    };
  }, []);

  const agent = status?.agent;
  const lastRun = status?.lastRun;

  const isActive =
    agent?.status === "ACTIVE";

  const isProcessing =
    agent?.isProcessing === true;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-bold text-black">
              A
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                AutoScribe
              </h1>

              <p className="text-xs text-zinc-500">
                Autonomous AI & Technology Editorial Agent
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-2 ${isActive
              ? "border-emerald-900 bg-emerald-950/40"
              : "border-zinc-700 bg-zinc-900"
              }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isActive
                ? "animate-pulse bg-emerald-400"
                : "bg-zinc-500"
                }`}
            />

            <span
              className={`text-xs font-medium ${isActive
                ? "text-emerald-400"
                : "text-zinc-400"
                }`}
            >
              {isActive
                ? "AUTONOMOUS"
                : agent?.status ?? "LOADING"}
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              {agent?.domain ??
                "AI Technology Intelligence"}
            </p>

            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Discover.
              <br />
              Evaluate.
              <br />
              Publish.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
              AutoScribe independently discovers
              developments in AI and technology,
              evaluates their significance, and
              publishes only topics that meet its
              editorial standards.
            </p>
          </div>
        </div>
      </section>

      {/* Autonomous system status */}
      <section className="mx-auto max-w-7xl px-6 pt-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Autonomous System
              </p>

              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${isProcessing
                    ? "animate-pulse bg-yellow-400"
                    : isActive
                      ? "bg-emerald-400"
                      : "bg-zinc-500"
                    }`}
                />

                <h3 className="text-xl font-semibold text-white">
                  {isProcessing
                    ? "Processing"
                    : isActive
                      ? "Waiting for next cycle"
                      : "Agent paused"}
                </h3>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                {isProcessing
                  ? "AutoScribe is currently discovering and evaluating topics."
                  : "The autonomous pipeline is ready for its next scheduled run."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              <StatusMetric
                label="Last run"
                value={
                  lastRun
                    ? formatRelativeTime(
                      lastRun.finishedAt ??
                      lastRun.startedAt,
                    )
                    : "—"
                }
              />

              <StatusMetric
                label="Next run"
                value={
                  agent?.nextRunAt
                    ? formatRelativeTime(
                      agent.nextRunAt,
                    )
                    : "—"
                }
              />

              <StatusMetric
                label="Run status"
                value={
                  lastRun?.status ?? "—"
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Published"
            value={
              status?.statistics
                .published ?? posts.length
            }
            description="Posts in the autonomous feed"
          />

          <StatCard
            label="Discovered"
            value={
              lastRun?.topicsFound ?? "—"
            }
            description="Topics found in last cycle"
          />

          <StatCard
            label="Evaluated"
            value={
              lastRun?.topicsEvaluated ?? "—"
            }
            description="Topics reviewed by editorial AI"
          />

          <StatCard
            label="Rejected"
            value={
              lastRun?.topicsRejected ?? "—"
            }
            description="Topics rejected by editorial standards"
          />
        </div>
      </section>

      {/* Pipeline */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Latest Autonomous Cycle
            </p>

            <h3 className="mt-2 text-xl font-semibold text-white">
              Editorial pipeline
            </h3>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <PipelineStep
              label="Discovery"
              value={
                lastRun
                  ? `${lastRun.topicsFound} topics`
                  : "Waiting"
              }
              active={
                lastRun !== null
              }
            />

            <PipelineStep
              label="Editorial"
              value={
                lastRun
                  ? `${lastRun.topicsEvaluated} evaluated`
                  : "Waiting"
              }
              active={
                lastRun !== null
              }
            />

            <PipelineStep
              label="Selection"
              value={
                lastRun
                  ? `${lastRun.topicsSelected} selected`
                  : "Waiting"
              }
              active={
                lastRun !== null
              }
            />

            <PipelineStep
              label="Publishing"
              value={
                lastRun
                  ? `${lastRun.topicsPublished} published`
                  : "Waiting"
              }
              active={
                lastRun !== null
              }
            />
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Autonomous Feed
            </p>

            <h3 className="mt-2 text-2xl font-semibold text-white">
              Latest publications
            </h3>
          </div>

          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="group flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${refreshing
                  ? "animate-spin"
                  : "group-hover:rotate-180"
                }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 11a8.1 8.1 0 0 0-15.5-3M4 4v4h4"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 13a8.1 8.1 0 0 0 15.5 3M20 20v-4h-4"
              />
            </svg>

            <span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center text-sm text-zinc-500">
            Loading AutoScribe's feed...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          posts.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
              <p className="text-zinc-400">
                AutoScribe has not published anything yet.
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                The autonomous agent is waiting
                for a qualifying development.
              </p>
            </div>
          )}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-zinc-600">
          <span>AutoScribe AI</span>

          <span>
            Autonomous editorial system
          </span>
        </div>
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function StatusMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function PipelineStep({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${active
            ? "bg-emerald-400"
            : "bg-zinc-700"
            }`}
        />

        <span className="text-sm font-medium text-zinc-300">
          {label}
        </span>
      </div>

      <p className="mt-3 text-sm text-zinc-500">
        {value}
      </p>
    </div>
  );
}

function PostCard({
  post,
}: {
  post: Post;
}) {
  const date = new Date(
    post.publishedAt,
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-400">
            {post.topic.sourceName}
          </span>

          <span className="text-zinc-600">
            {date.toLocaleString()}
          </span>
        </div>

        <h4 className="mt-5 text-2xl font-semibold leading-tight text-white">
          {post.topic.title}
        </h4>

        <div className="mt-6 border-l-2 border-zinc-700 pl-5">
          <p className="whitespace-pre-line text-base leading-7 text-zinc-300">
            {post.text}
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-black/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Why AutoScribe selected this
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {post.rationale}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <a
            href={post.topic.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-white"
          >
            View original source →
          </a>

          <span className="font-mono text-xs text-zinc-700">
            {post.id}
          </span>
        </div>
      </div>
    </article>
  );
}

function formatRelativeTime(
  value: string,
) {
  const target =
    new Date(value).getTime();

  const now = Date.now();

  const difference =
    target - now;

  const minutes = Math.round(
    Math.abs(difference) /
    60_000,
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return difference > 0
      ? `in ${minutes}m`
      : `${minutes}m ago`;
  }

  const hours = Math.round(
    minutes / 60,
  );

  if (hours < 24) {
    return difference > 0
      ? `in ${hours}h`
      : `${hours}h ago`;
  }

  const days = Math.round(
    hours / 24,
  );

  return difference > 0
    ? `in ${days}d`
    : `${days}d ago`;
}