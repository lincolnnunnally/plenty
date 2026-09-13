# Plenty — agent notes

Inherits from `~/Documents/Project_Code/life-produces-life/_SOURCE_OF_TRUTH/`.
If anything here conflicts with the master, the master wins.

## What this is

**Plenty** is the ecosystem food-pantry expression. It is how Lincoln (and later other stewards) **set up, run, manage, and promote a pantry** — donors of food, money, space, and vehicles; volunteers who pick up, set up, and serve; neighbors who come for groceries **and** a next step toward the person they want to become.

Transformation is the product. Food is the doorway. A bag of groceries without a path is incomplete.

## Locked split with United Under God (owner lock 2026-09-13)

- United Under God is the charity and the front door. Donor of record, tax receipt, EIN.
- Plenty is the pantry and the workbench. Pickup window, load, driver, what was received, who was served.
- First signup / tax records → United Under God. Every pickup after that → Plenty.
- UUG may invite grocers. UUG does not schedule pickups. “Request pickup” opens Plenty.
- Receipts always say United Under God, Inc. Plenty is a program, not a second charity.
- Shared database. One system of record per job. Do not keep two living pickup desks.

## What this is not

- Not an App Engine customer module.
- Not an Operate shop kind. Operate is a business desk; a pantry that accidentally landed there as `kind=pantry` is inventory-for-a-shop, not this product. Do not absorb Plenty into Operate.
- Not Neighborly's pantry directory. Neighborly lists pantries neighbors can find. Plenty **runs** a pantry. Plenty's public page can be listed on Neighborly when hours are real.
- Not a ChurchConnect ministry rebuild. ChurchConnect may hand people here; it does not own the pantry.
- Not the 501(c)(3). United Under God, Inc. receives the gifts.

## First implementation

Vidalia, Georgia. Do not invent hours, addresses, donors, neighbors, or volunteers. Honest empty until a steward types the real thing.

## Shared identity

Shared LPL GoTrue + `plenty_*` tables on the shared Supabase (prefix, additive-only). One person can be a neighbor, volunteer, donor, and steward over time — that movement is the win.

## Authority

- Super admin: `lincoln@unitedundergod.org` only (optional extra list `PLENTY_SUPER_ADMIN_EMAILS`).
- Pantry desk: super admin **or** explicit `steward`/`admin` membership. Recipients, volunteers, and donors never get the desk by signing up.
- Super admin grants/revokes pantry admin. Do not treat `APP_ENGINE_OWNER_EMAIL` or JWT `owner` as desk access.
- Food is never gated on a donation, waiver, or growth form.
- Promote is enter-once (flyers, QR, social kits, email). Do not ship copy-only boxes as "promotion." Auto-post to Meta needs a page token; until then generate complete posts and assets.

## Live URL

https://plenty.unitedundergod.org

## Language

Prefer: hope, belonging, purpose, next step, practical help, becoming, dignity.
Avoid: guilt, "the less fortunate," points/streaks on visits, gating food on a growth form.
