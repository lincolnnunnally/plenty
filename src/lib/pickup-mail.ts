import { logPickupEmail, listPickupRoutes } from "@/lib/db/pickup-desk";
import { sendNoticeEmail } from "@/lib/notify";
import { ownerNoticeFailureReason } from "@/lib/owner-signup-notice";
import { matchingRouteEmails, runPlannedSend, type NoticeKind } from "@/lib/pickup-routes";

export async function deliverPickupNotice(input: {
  notice: NoticeKind;
  pickupKind: string;
  scheduledFor?: string | null;
  weekday?: string | null;
  pantryId: string;
  pickupId: string | null;
  subject: string;
  text: string;
}): Promise<{ ok: boolean }> {
  let routed: string[] = [];
  if (input.pantryId) {
    try {
      const routes = await listPickupRoutes(input.pantryId);
      routed = matchingRouteEmails(routes.rows, {
        kind: input.pickupKind,
        scheduledFor: input.scheduledFor,
        weekday: input.weekday
      });
    } catch (err) {
      console.error("[plenty] pickup routes skipped:", ownerNoticeFailureReason(err));
    }
  }
  try {
    return await runPlannedSend({
      notice: input.notice,
      routed,
      subject: input.subject,
      text: input.text,
      send: async (message) => {
        const result = await sendNoticeEmail(message);
        if (!result.ok) console.error("[plenty] pickup email failed:", ownerNoticeFailureReason(result.error));
        return result;
      },
      log: async (row) => {
        if (!input.pantryId) return;
        await logPickupEmail({
          pantryId: input.pantryId,
          pickupId: input.pickupId,
          to: row.to,
          kind: row.kind,
          providerId: row.providerId,
          status: row.status,
          error: row.error
        });
      }
    });
  } catch (err) {
    console.error("[plenty] pickup email failed:", ownerNoticeFailureReason(err));
    return { ok: false };
  }
}
