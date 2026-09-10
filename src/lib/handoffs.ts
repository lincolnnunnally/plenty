/** Real live doors. Do not invent hosts. */

export type Handoff = {
  id: string;
  name: string;
  when: string;
  href: string;
};

export const HANDOFFS: Handoff[] = [
  {
    id: "spark",
    name: "Spark of Hope",
    when: "You need encouragement before you can move",
    href: "https://spark.unitedundergod.org/"
  },
  {
    id: "lom",
    name: "Live On Mission",
    when: "The next step is to serve someone else — even a small act",
    href: "https://liveonmission.unitedundergod.org/"
  },
  {
    id: "bestlife",
    name: "Best Life",
    when: "You want to grow in an aspect of life — work, health, money, purpose",
    href: "https://bestlife.unitedundergod.org/"
  },
  {
    id: "opportunity",
    name: "Opportunity",
    when: "You can name a problem and want a practical next step inside it",
    href: "https://opportunity.unitedundergod.org/"
  },
  {
    id: "kindred",
    name: "Kindred Connections",
    when: "You need friendship and people who build you up",
    href: "https://kindred.unitedundergod.org/"
  },
  {
    id: "neighborly",
    name: "Neighborly",
    when: "This is a neighborhood need, not only a personal one",
    href: "https://neighborly.unitedundergod.org/"
  },
  {
    id: "churchconnect",
    name: "ChurchConnect",
    when: "A church is the right place to belong or serve",
    href: "https://churchconnect.unitedundergod.org/"
  }
];

export function suggestHandoffs(text: string): Handoff[] {
  const t = text.toLowerCase();
  const hits: Handoff[] = [];
  const add = (id: string) => {
    const h = HANDOFFS.find((x) => x.id === id);
    if (h && !hits.some((x) => x.id === id)) hits.push(h);
  };
  if (/(hopeless|discourag|despair|give up|can't go on|depressed|alone in this)/.test(t)) add("spark");
  if (/(lonely|isolat|friend|belong)/.test(t)) add("kindred");
  if (/(church|pastor|congregation|sunday|jesus|pray)/.test(t)) add("churchconnect");
  if (/(neighbor|street|block|town|community|vidalia|toombs)/.test(t)) add("neighborly");
  if (/(job|work|money|bills|debt|career|skill|school|health|habit|purpose|grow)/.test(t)) add("bestlife");
  if (/(problem|stuck|don't know|dead end|what now)/.test(t)) add("opportunity");
  if (/(volunteer|serve|give back|help others)/.test(t)) add("lom");
  if (hits.length === 0) add("bestlife");
  return hits.slice(0, 3);
}
