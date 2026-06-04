import { proofExists, readProof } from "@/lib/scratch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await proofExists())) {
    return new Response("No proof screenshot yet.", { status: 404 });
  }
  const buffer = await readProof();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
