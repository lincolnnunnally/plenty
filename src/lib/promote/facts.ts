import {
  availableThisWeek,
  listDistributions,
  weNeedList,
  type Pantry
} from "@/lib/db/queries";
import { pantryPublicUrl } from "@/lib/public-url";
import { composeKit, isAudience, type Audience, type PromoteFacts } from "./compose";

export async function promoteFacts(pantry: Pantry, audience: string, extra = ""): Promise<PromoteFacts> {
  const chosen: Audience = isAudience(audience) ? audience : "families";
  const [week, needs, distributions] = await Promise.all([
    availableThisWeek(pantry.id),
    weNeedList(pantry.id),
    listDistributions(pantry.id)
  ]);
  return {
    pantry,
    url: pantryPublicUrl(pantry.slug),
    week,
    needs,
    distributions,
    extra,
    audience: chosen
  };
}

export async function kitFor(pantry: Pantry, audience: string, extra = "") {
  const facts = await promoteFacts(pantry, audience, extra);
  return { facts, kit: composeKit(facts) };
}
