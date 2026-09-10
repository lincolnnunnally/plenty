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

export const TOOMBS_STARTING_POINTS: StartingPoint[] = [
  {
    kind: "pantry",
    name: "God's Storehouse",
    address: "2200 Center Drive",
    city: "Vidalia",
    zip: "30474",
    phone: "(912) 538-1730",
    hoursHint: "Directories still list 300 McIntosh St. They moved. Confirm hours in person.",
    sourceNote: "Food and clothing. Meet first. Do not list publicly until you walk in."
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
    address: "803 Reidsville Highway",
    city: "Lyons",
    zip: "30436",
    phone: "(912) 526-4320",
    hoursHint: "Directories disagree on days. Confirm.",
    sourceNote: "Church pantry. Meet first."
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
