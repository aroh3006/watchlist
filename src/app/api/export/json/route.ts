import { requireUser } from "@/lib/session";
import { gatherUserExport } from "@/lib/export";
import { handleApiError } from "@/lib/apiError";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await gatherUserExport(user.id);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="watchlist-export-${user.id}.json"`,
      },
    });
  } catch (err) {
    return handleApiError(err, "Export failed.");
  }
}
