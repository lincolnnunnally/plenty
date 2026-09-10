export type Lang = "en" | "es";

export const MESSAGES = {
  en: {
    langName: "English",
    otherLang: "Español",
    getFood: "Get food",
    thisWeek: "This week",
    volunteer: "Volunteer",
    give: "Give",
    account: "Account",
    lineTitle: "Check in",
    lineLede:
      "This food is for everyone — no income test. Scan to check in. Pay handling before you arrive or here. Cannot come? Ask for a delivery. Take what you will use. Share what you will not.",
    findMe: "Find me",
    findHousehold: "Find household",
    phoneOptional: "Phone if you have one",
    name: "Name",
    peopleCount: "How many people you are feeding",
    newHousehold: "New household — about a minute",
    checkIn: "Check in",
    saving: "Saving…",
    handlingTitle: "Handling donation — requested, not required",
    handlingAlready: "Handling already given",
    handlingLede:
      "You are checked in. The food is free. We request a donation for handling and orchestration — pickup, routing, and running this line — not for the groceries. Pay now or say you cannot.",
    handlingPaidLede: "You already gave a handling donation. The food is free. You are checked in for today.",
    sentCashapp: "I sent it on Cash App",
    sentVenmo: "I sent it on Venmo",
    sentZelle: "I sent it on Zelle",
    sentCash: "I paid cash",
    cannotHelp: "I cannot help with handling this time",
    nextHousehold: "Next household",
    yourPass: "Your pass for next time — screenshot or we write it down",
    walkthrough: "Count someone with no phone / no registration",
    walkthroughHint: "Writes a name if we have one, or records that someone came through the line.",
    everyone:
      "This food is for everyone. There is no income requirement. You know your household better than a form does.",
    delivery: "Need food brought to you?",
    moreHelp: "More help after groceries — optional",
    bagTitle: "What went in the bag",
    bagLede: "Check what they took. This comes off the shelf and stays on this visit.",
    noBag: "Nothing is marked for this week yet. Check in anyway — food is never gated on a list."
  },
  es: {
    langName: "Español",
    otherLang: "English",
    getFood: "Comida",
    thisWeek: "Esta semana",
    volunteer: "Voluntario",
    give: "Dar",
    account: "Cuenta",
    lineTitle: "Registrarse",
    lineLede:
      "Esta comida es para todos — no hay requisito de ingresos. Regístrese aquí. Puede ayudar con el manejo ahora o cuando llegue. ¿No puede venir? Pida una entrega. Tome lo que va a usar. Comparta lo que no.",
    findMe: "Buscarme",
    findHousehold: "Buscar familia",
    phoneOptional: "Teléfono si tiene",
    name: "Nombre",
    peopleCount: "Cuántas personas come su casa",
    newHousehold: "Familia nueva — un minuto",
    checkIn: "Registrar visita",
    saving: "Guardando…",
    handlingTitle: "Donación de manejo — se pide, no se exige",
    handlingAlready: "El manejo ya está dado",
    handlingLede:
      "Ya está registrado. La comida es gratis. Pedimos una donación para el manejo — recoger, llevar y esta fila — no por la comida. Si no puede, dígalo.",
    handlingPaidLede: "Ya dio una donación de manejo. La comida es gratis. Quedó registrado hoy.",
    sentCashapp: "Lo envié por Cash App",
    sentVenmo: "Lo envié por Venmo",
    sentZelle: "Lo envié por Zelle",
    sentCash: "Pagué en efectivo",
    cannotHelp: "No puedo ayudar con el manejo esta vez",
    nextHousehold: "Siguiente familia",
    yourPass: "Su pase para la próxima vez — captura de pantalla o lo anotamos",
    walkthrough: "Contar a alguien sin teléfono / sin registro",
    walkthroughHint: "Anota un nombre si lo tenemos, o registra que alguien pasó por la fila.",
    everyone:
      "Esta comida es para todos. No hay requisito de ingresos. Usted conoce su casa mejor que un formulario.",
    delivery: "¿Necesita que le llevemos la comida?",
    moreHelp: "Más ayuda después de la comida — opcional",
    bagTitle: "Lo que se llevaron",
    bagLede: "Anote lo que tomaron. Sale del estante y queda en esta visita.",
    noBag: "Todavía no hay lista de esta semana. Igual se registran — la comida no depende de una lista."
  }
} as const;

export type MsgKey = keyof typeof MESSAGES.en;

export function t(lang: Lang, key: MsgKey) {
  return MESSAGES[lang][key] || MESSAGES.en[key];
}

export function readLang(value?: string | null): Lang {
  return value === "es" ? "es" : "en";
}
