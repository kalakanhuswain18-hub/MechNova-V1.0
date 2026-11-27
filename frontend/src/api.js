const API_BASE_URL = "http://127.0.0.1:8000";

export async function getHealthSummary() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/dashboard/health-summary`
  );

  if (!response.ok) {
    throw new Error("Unable to fetch machine health summary");
  }

  return await response.json();
}