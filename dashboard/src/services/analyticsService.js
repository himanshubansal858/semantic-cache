export const fetchAnalytics = async (signal) => {
  const response = await fetch("/api/analytics", { signal });

  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.metrics) {
    throw new Error("Invalid analytics response");
  }

  return data.metrics;
};