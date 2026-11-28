
import { useState } from "react";
import { Send, Loader2, CheckCircle2, Database, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
            setError(err.message || "Unable to process your request.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();

            if (!loading && question.trim()) {
                event.currentTarget.form?.requestSubmit();
            }
        }
    };

    const isCacheHit = result?.cache?.hit === true;

    return (
        <section className="mt-8 rounded-2xl border border-[#E4E1DB] bg-white p-6 text-[#252D3A] shadow-sm md:p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAE9DC] text-[#C87754]">
                        <Database size={20} />
                    </div>

                    <h2 className="text-xl font-semibold tracking-tight text-[#252D3A]">
                        API Playground
                    </h2>
                </div>

                <p className="text-sm leading-6 text-[#687180]">
                    Ask a question and observe how semantic caching works.
                    Try asking the same question in different ways.
                </p>
            </div>

            {/* Question form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="playground-question"
                        className="mb-2 block text-sm font-medium text-[#252D3A]"
                    >
                        Your Question
                    </label>

                    <textarea
                        id="playground-question"
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What is a binary search tree?"
                        rows={4}
                        maxLength={2000}
                        disabled={loading}
                        className="w-full resize-y rounded-xl border border-[#E4E1DB] bg-[#FAF9F6] p-4 text-sm leading-7 text-[#252D3A] outline-none transition-all placeholder:text-[#939AA5] focus:border-[#C87754] focus:ring-2 focus:ring-[#C87754]/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <p className="mt-1 text-right text-xs text-[#939AA5]">
                        Enter to submit · Shift + Enter for a new line
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C87754] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#AD6040] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* Error state */}
            {error && (
                <div
                    role="alert"
                    className="mt-6 flex items-start gap-3 rounded-xl border border-[#F2D4CE] bg-[#FFF4F1] p-4 text-sm text-[#A34E42]"
                >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* API response */}
            {result && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-[#E4E1DB] bg-[#FAF9F6]">
                    {/* Response metadata */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-[#E4E1DB] bg-white px-5 py-4">
                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                isCacheHit
                                    ? "bg-[#E4F1E8] text-[#32724B]"
                                    : "bg-[#FAE9DC] text-[#A65D36]"
                            }`}
                        >
                            {isCacheHit ? (
                                <CheckCircle2 size={15} />
                            ) : (
                                <Database size={15} />
                            )}

                            {isCacheHit ? "Cache Hit" : "Cache Miss"}
                        </span>

                        {typeof result.cache?.similarity === "number" && (
                            <span className="rounded-full border border-[#E4E1DB] bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#687180]">
                                Similarity:{" "}
                                {(result.cache.similarity * 100).toFixed(2)}%
                            </span>
                        )}

                        {result.cache?.stored === true && !isCacheHit && (
                            <span className="text-xs font-medium text-[#687180]">
                                Answer stored in cache
                            </span>
                        )}
                    </div>

                    {/* Answer */}
                    <div className="p-5 md:p-6">
                        <h3 className="mb-4 text-base font-semibold text-[#252D3A]">
                            Answer
                        </h3>

                        <div
                            className="
                                min-w-0 break-words text-sm leading-7 text-[#374151]
                                [&_p]:my-3
                                [&_p:first-child]:mt-0
                                [&_h1]:mb-3
                                [&_h1]:mt-6
                                [&_h1]:text-xl
                                [&_h1]:font-bold
                                [&_h1]:text-[#252D3A]
                                [&_h2]:mb-3
                                [&_h2]:mt-6
                                [&_h2]:text-lg
                                [&_h2]:font-semibold
                                [&_h2]:text-[#252D3A]
                                [&_h3]:mb-2
                                [&_h3]:mt-5
                                [&_h3]:text-base
                                [&_h3]:font-semibold
                                [&_h3]:text-[#252D3A]
                                [&_ul]:my-3
                                [&_ul]:list-disc
                                [&_ul]:space-y-1
                                [&_ul]:pl-6
                                [&_ol]:my-3
                                [&_ol]:list-decimal
                                [&_ol]:space-y-1
                                [&_ol]:pl-6
                                [&_li]:pl-1
                                [&_strong]:font-semibold
                                [&_strong]:text-[#252D3A]
                                [&_blockquote]:my-4
                                [&_blockquote]:border-l-4
                                [&_blockquote]:border-[#C87754]
                                [&_blockquote]:pl-4
                                [&_blockquote]:italic
                                [&_pre]:my-4
                                [&_pre]:overflow-x-auto
                                [&_pre]:rounded-xl
                                [&_pre]:bg-[#252D3A]
                                [&_pre]:p-4
                                [&_pre]:text-[#F7F5F0]
                                [&_code]:break-words
                                [&_code]:rounded
                                [&_code]:bg-[#EEEAE3]
                                [&_code]:px-1
                                [&_code]:py-0.5
                                [&_pre_code]:bg-transparent
                                [&_pre_code]:p-0
                                [&_table]:my-4
                                [&_table]:w-full
                                [&_table]:border-collapse
                                [&_th]:border
                                [&_th]:border-[#E4E1DB]
                                [&_th]:bg-[#F0EDE7]
                                [&_th]:px-3
                                [&_th]:py-2
                                [&_th]:text-left
                                [&_th]:font-semibold
                                [&_td]:border
                                [&_td]:border-[#E4E1DB]
                                [&_td]:px-3
                                [&_td]:py-2
                                [&_hr]:my-5
                                [&_hr]:border-[#E4E1DB]
                            "
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    table: ({ children, ...props }) => (
                                        <div className="my-4 overflow-x-auto">
                                            <table {...props}>
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                }}
                            >
                                {String(result.answer ?? "")}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Redis fallback notice */}
                    {(
                        result.redisAvailable === false ||
                        result.cache?.redisAvailable === false
                    ) && (
                        <div className="border-t border-[#F2D9B3] bg-[#FFF8E9] px-5 py-3 text-sm text-[#96671D]">
                            Redis unavailable — answer generated without caching.
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
