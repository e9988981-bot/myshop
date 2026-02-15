/**
 * Cloudflare Images: direct upload URL creation and delivery URL building.
 * Uses REST API with IMAGES_API_TOKEN (API Token with Images edit).
 */

const IMAGES_API_BASE = "https://api.cloudflare.com/client/v4/accounts";

export async function createDirectUploadUrl(
  accountId: string,
  apiToken: string,
  metadata?: Record<string, string>
): Promise<{ id: string; uploadURL: string }> {
  const url = `${IMAGES_API_BASE}/${accountId}/images/v2/direct_upload`;
  const form = new FormData();
  form.append("metadata", JSON.stringify(metadata ?? {}));
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Images API error: ${res.status} ${t}`);
  }
  const data = (await res.json()) as {
    result?: { id: string; uploadURL: string };
    success?: boolean;
  };
  if (!data.success || !data.result?.uploadURL) {
    throw new Error("Failed to get direct upload URL");
  }
  return { id: data.result.id, uploadURL: data.result.uploadURL };
}

/**
 * Build delivery URL for a variant.
 * Format: https://imagedelivery.net/<account_hash>/<image_id>/<variant>
 */
export function deliveryUrl(accountHash: string, imageId: string, variant: string): string {
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}
