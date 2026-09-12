import { DeskSwitch } from "@/components/desk-switch";

export function RunNav({
  pantries,
  currentId
}: {
  pantries?: { id: string; name: string }[];
  currentId?: string;
  superAdmin?: boolean;
}) {
  return (
    <div>
      {pantries && currentId ? <DeskSwitch pantries={pantries} currentId={currentId} /> : null}
      <nav className="subnav" aria-label="Pantry desk">
        <a href="/run">Setup</a>
        <a href="/run/line">Line</a>
        <a href="/run/calendar">Today</a>
        <a href="/run/people">People</a>
        <a href="/run/invite">Invite</a>
        <a href="/run/inventory">Shelves</a>
        <a href="/run/food">Rescue</a>
        <a href="/run/donors">Donors</a>
        <a href="/run/stores">Stores</a>
        <a href="/run/locations">Places</a>
        <a href="/run/donations">Gifts</a>
        <a href="/run/around">Around</a>
        <a href="/run/promote">Promote</a>
      </nav>
    </div>
  );
}
