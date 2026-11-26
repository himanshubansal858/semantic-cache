
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { askQuestion } from "../services/askService";

export default function ApiPlayground() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await askQuestion(trimmed);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-[#151521] p-6">
      <h2 className="text-xl font-semibold">API Playground</h2>

      <p className="mt-2 text-sm text-slate-400">
        Ask a question and observe how semantic caching works.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What is Java?"
          rows={3}
          maxLength={2000}
          disabled={loading}
          className="w-full resize-y rounded-xl border border-white/10 bg-[#09090f] p-4 text-white outline-none focus:border-cyan-400"
        />

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send size={18} />
              Send Question
            </>
          )}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-[#09090f] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                result.cache?.hit
                  ? "bg-green-500/10 text-green-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {result.cache?.hit ? "Cache Hit" : "Cache Miss"}
            </span>

            {typeof result.cache?.similarity === "number" && (
              <span className="text-sm text-slate-400">
                Similarity: {(result.cache.similarity * 100).toFixed(2)}%
              </span>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Answer</h3>
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
              {result.answer}
            </p>
          </div>

          {result.redisAvailable === false && (
            <p className="text-sm text-amber-400">
              Redis unavailable — answer generated without caching.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
