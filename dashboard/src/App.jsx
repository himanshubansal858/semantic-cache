
import {
  Activity,
  Database,
  Gauge,
  Zap,
  Clock3
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { useEffect, useState } from "react";
import { fetchAnalytics } from "./services/analyticsService";


function MetricCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151521] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={19} className="text-cyan-400" />
      </div>

      <h2 className="mt-4 text-3xl font-semibold text-white">
        {value}
      </h2>

      <p className="mt-2 text-xs text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

function App() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadAnalytics = async () => {
      try {
        const data = await fetchAnalytics(controller.signal);

        if (!active) return;

        setMetrics(data);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (!active || err.name === "AbortError") return;

        setError(err.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    const interval = setInterval(loadAnalytics, 5000);

    return () => {
      active = false;
      clearInterval(interval);
      controller.abort();
    };
  }, []);
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090f] text-white">
        Loading analytics...
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#09090f] text-white">
        <h2 className="text-xl font-semibold">
          Analytics unavailable
        </h2>

        <p className="text-sm text-red-400">
          {error}
        </p>

        <p className="text-sm text-slate-400">
          Retrying automatically every 5 seconds...
        </p>
      </div>
    );
  }

  const chartData = [
    {
      name: "Cache Hit",
      latency: metrics.averageCacheHitMs
    },
    {
      name: "Cache Miss",
      latency: metrics.averageCacheMissMs
    }
  ];
  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <div className="flex items-center gap-3">
            <Database size={30} className="text-cyan-400" />
            <h1 className="text-3xl font-bold">
              Semantic Cache
            </h1>
          </div>
          <p className="mt-2 text-slate-400">
            Real-time performance monitoring dashboard
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${error
                ? "bg-red-500/10 text-red-400"
                : "bg-green-500/10 text-green-400"
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${error ? "bg-red-400" : "bg-green-400"
                  }`}
              />

              {error ? "Analytics API unavailable" : "Analytics API connected"}
            </span>

            {lastUpdated && (
              <span className="text-xs text-slate-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          {error && metrics && (
            <p className="mt-3 text-sm text-amber-400">
              Showing the last successfully fetched metrics.
              Retrying automatically...
            </p>
          )}
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Requests"
            value={metrics.totalRequests}
            icon={Activity}
            subtitle="Requests processed"
          />
          <MetricCard
            title="Cache Hit Rate"
            value={`${metrics.cacheHitRate}%`}
            icon={Gauge}
            subtitle={`${metrics.cacheHits} cache hits`}
          />
          <MetricCard
            title="Gemini Calls"
            value={metrics.geminiCalls}
            icon={Zap}
            subtitle="LLM requests"
          />
          <MetricCard
            title="Speedup"
            value={`${metrics.speedup}x`}
            icon={Clock3}
            subtitle="Observed average miss / hit latency ratio"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-[#151521] p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold">
              Response Time Comparison
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Average latency in milliseconds
            </p>

            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    stroke="#333344"
                    strokeDasharray="3 3"
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis
                    stroke="#94a3b8"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}s`}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${(Number(value) / 1000).toFixed(2)} seconds`,
                      "Average latency"
                    ]}
                  />
                  <Bar
                    dataKey="latency"
                    fill="#22d3ee"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#151521] p-6">
            <h2 className="text-lg font-semibold">
              Cache Overview
            </h2>

            <div className="mt-8 space-y-6">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-400">Cache Hits</span>
                  <span>{metrics.cacheHits}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-cyan-400"
                    style={{
                      width: `${metrics.cacheHitRate}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cache Misses</span>
                <span>{metrics.cacheMisses}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Failed Requests</span>
                <span>{metrics.failedRequests}</span>
              </div>

            </div>
          </section>
        </div>

        <footer className="mt-10 text-center text-xs text-slate-500">
          Semantic Cache • Analytics Dashboard
        </footer>
      </div>
    </div>
  );
}

export default App;
