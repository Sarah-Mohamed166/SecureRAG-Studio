import { getConfig } from "@/lib/securerag/config";

export async function GET() {
  const config = getConfig();
  const isProviderConfigured = Boolean(config.geminiApiKey);

  return Response.json(
    {
      status: isProviderConfigured ? "healthy" : "degraded",
      service: "SecureRAG Studio",
      environment: config.nodeEnv,
      checks: {
        api: "available",
        providerConfigured: isProviderConfigured,
      },
      timestamp: new Date().toISOString(),
    },
    {
      // Never expose the key itself -- only whether it's configured.
      status: isProviderConfigured ? 200 : 503,
    },
  );
}
