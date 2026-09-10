/** Directory starting points for Toombs County (Vidalia and Lyons). Hours online disagree. Not public until a steward confirms in person. */

export type StartingPoint = {
  kind: "pantry" | "thrift" | "church";
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  hoursHint: string;
  sourceNote: string;
};

export type FieldVisit = {
  names: string[];
  kind: "pantry" | "thrift" | "church";
  address: string;
  city: string;
  zip: string;
  phone: string;
  hoursText: string;
  contactName: string;
  relationship: "running_own" | "visited" | "closed" | "to_meet";
  listedPublicly: boolean;
  visitNotes: string;
  sourceNote: string;
  visitedOn: string;
};

export const TOOMBS_STARTING_POINTS: StartingPoint[] = [
  {
    kind: "pantry",
    name: "God's Storehouse",
    address: "2200 Center Drive",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 538-1730",
    hoursHint: "Directories still list 300 McIntosh St and a 2022 move to Center Drive. Confirm in person.",
    sourceNote: "Food and clothing. Meet first. Do not list publicly until you walk in."
  },
  {
    kind: "pantry",
    name: "Vidalia Church of God",
    address: "401 Adams St",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 537-4361",
    hoursHint: "Directories list a pantry with no day or time. Confirm in person.",
    sourceNote: "On the Neighborly Toombs list. Meet first."
  },
  {
    kind: "pantry",
    name: "Concerted Services — Toombs County Service Center",
    address: "107 Old Airport Road",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 285-6083",
    hoursHint: "Directories say weekdays. Confirm.",
    sourceNote: "Starting point from public directories. Confirm before listing."
  },
  {
    kind: "pantry",
    name: "His Works Ministry Outreach and Food Bank",
    address: "120 E Liberty Avenue",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 388-8043",
    hoursHint: "Directories say Mon–Wed mornings. Confirm.",
    sourceNote: "Starting point from public directories. Confirm before listing."
  },
  {
    kind: "pantry",
    name: "Southeast Georgia Community Projects",
    address: "300 South State Street",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 526-5451",
    hoursHint: "Hours disagree across directories. Confirm.",
    sourceNote: "Starting point from public directories. Confirm before listing."
  },
  {
    kind: "pantry",
    name: "Oasis Church of God pantry",
    address: "1163 US Highway 1 South",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 526-5060",
    hoursHint: "Directories mention Monday and Friday windows. Confirm.",
    sourceNote: "Church pantry. Meet first. If they are happy as they are, leave them be."
  },
  {
    kind: "pantry",
    name: "Lyons Free Will Baptist Church pantry",
    address: "455 Reidsville Highway",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 526-4320",
    hoursHint: "Directories disagreed. Confirm in person.",
    sourceNote: "Church pantry. Directories listed 803 Reidsville Highway — that address does not open in Maps."
  },
  {
    kind: "pantry",
    name: "Wings of Hope Outreach",
    address: "164 North Main Street",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 526-6078",
    hoursHint: "One directory says Thursday morning. Confirm.",
    sourceNote: "Starting point from public directories. Confirm before listing."
  },
  {
    kind: "pantry",
    name: "Bread of Heaven Outreach",
    address: "2201 McIntosh Street",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 403-9498",
    hoursHint: "Second Harvest says check Facebook for the next distribution.",
    sourceNote: "Starting point. Confirm before listing."
  },
  {
    kind: "thrift",
    name: "Goodwill of Southeast Georgia — Vidalia",
    address: "1107 East First Street",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 537-2154",
    hoursHint: "Retail hours are posted by Goodwill. Confirm if they want a food partnership.",
    sourceNote: "Thrift store. Meet them. Do not force a food partnership."
  },
  {
    kind: "thrift",
    name: "Salvation Army — Vidalia",
    address: "204 Jackson Street",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 538-8203",
    hoursHint: "Confirm what they offer now.",
    sourceNote: "Starting point. Meet first."
  },
  {
    kind: "church",
    name: "First Baptist Church of Vidalia",
    address: "",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 537-4196",
    hoursHint: "",
    sourceNote: "Ask if they have volunteers who want to help a pantry — ours or one already here."
  },
  {
    kind: "church",
    name: "First United Methodist Church of Vidalia",
    address: "",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 537-3068",
    hoursHint: "",
    sourceNote: "Ask if they have volunteers who want to help a pantry — ours or one already here."
  },
  {
    kind: "church",
    name: "First Baptist Church of Lyons",
    address: "",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 526-8136",
    hoursHint: "",
    sourceNote: "Ask if they have volunteers who want to help a pantry — ours or one already here."
  },
  {
    kind: "church",
    name: "First United Methodist Church of Lyons",
    address: "",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 526-6078",
    hoursHint: "",
    sourceNote: "May overlap with Wings of Hope. Ask. Do not assume."
  }
];

/** In-person checks. These overwrite directory guesses. Do not invent hours. */
export const FIELD_VISITS: FieldVisit[] = [
  {
    names: ["Vidalia Church of God"],
    kind: "pantry",
    address: "401 Adams St",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 537-4361",
    hoursText: "Third Wednesday of the month. Starts serving about 4:00 p.m.",
    contactName: "Billy — associate pastor and youth pastor. Nikki — his wife.",
    relationship: "running_own",
    listedPublicly: true,
    visitNotes:
      "Visited in person 10 Sep 2026. They operate one Wednesday a month — the third Wednesday. Start serving about 4 o'clock. Met Billy (associate pastor and youth pastor) and his wife Nikki.",
    sourceNote: "Hours confirmed in person. Address and phone from the Neighborly directory.",
    visitedOn: "2026-09-10"
  },
  {
    names: ["God's Storehouse", "God's Store House"],
    kind: "pantry",
    address: "2200 Center Drive",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 538-1730",
    hoursText: "Not operating at this address.",
    contactName: "",
    relationship: "closed",
    listedPublicly: true,
    visitNotes:
      "Visited in person 10 Sep 2026. The building is empty and for sale. Either out of business or moved. Do not send people here.",
    sourceNote: "Last known address 2200 Center Drive. Directories still print a 2022 move from 300 McIntosh St.",
    visitedOn: "2026-09-10"
  },
  {
    names: ["His Works Ministry Outreach and Food Bank", "His Works Ministry Outreach & Food Bank", "His Works"],
    kind: "pantry",
    address: "120 E Liberty Avenue",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 388-8043",
    hoursText: "Monday, Tuesday, Wednesday 10:00 a.m. – 2:00 p.m. In the back of the old warehouse.",
    contactName: "",
    relationship: "running_own",
    listedPublicly: true,
    visitNotes:
      "Visited in person 10 Sep 2026. Sign on the door: Monday, Tuesday, Wednesday 10 AM to 2 PM. Still in operation. They are in the back of some old warehouse.",
    sourceNote: "Hours from the sign on the door. Directories had been listing 10–1.",
    visitedOn: "2026-09-10"
  },
  {
    names: [
      "Lyons Free Will Baptist Church pantry",
      "Lyons Free Will Baptist Church food pantry",
      "Lyons Free Will Baptist Church"
    ],
    kind: "pantry",
    address: "455 Reidsville Highway",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 526-4320",
    hoursText: "Second and fourth Friday of the month, about 2:00–5:00 p.m.",
    contactName: "Kevin — told Lincoln the distribution hours.",
    relationship: "running_own",
    listedPublicly: true,
    visitNotes:
      "Visited in person 10 Sep 2026. Directory address 803 Reidsville Highway does not open in Maps. Searching the church name dropped Lincoln at a pin that was not the church; the church is around the corner. Building is at 455 Reidsville Highway (corner of Reidsville Highway and South 10th). Kevin said they distribute the second and fourth Friday, about 2:00 till 5:00.",
    sourceNote: "Hours from Kevin on site. Address from the church's own 455 Reidsville Hwy listing. Directories still print 803.",
    visitedOn: "2026-09-10"
  }
];

export function allyNameKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
