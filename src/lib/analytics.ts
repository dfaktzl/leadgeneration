// Lightweight client-side analytics. No external SDK — just structured
// console events + a session-scoped store so we can correlate testimonial
// engagement with quote submissions.

type EventName =
  | "testimonial_view"
  | "testimonial_slide"
  | "testimonial_swipe"
  | "quote_form_view"
  | "quote_submitted";

type Payload = Record<string, string | number | boolean | null | undefined>;

const KEY = "pt_analytics_v1";

function read(): { sessionId: string; events: Array<{ name: EventName; ts: number; data?: Payload }> } {
  if (typeof window === "undefined") return { sessionId: "ssr", events: [] };
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const fresh = {
    sessionId:
      (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
      Math.random().toString(36).slice(2),
    events: [] as Array<{ name: EventName; ts: number; data?: Payload }>,
  };
  sessionStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}

export function track(name: EventName, data?: Payload) {
  if (typeof window === "undefined") return;
  const state = read();
  state.events.push({ name, ts: Date.now(), data });
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  // eslint-disable-next-line no-console
  console.info(`[analytics] ${name}`, { sessionId: state.sessionId, ...data });
}

export function getEngagementSummary() {
  const state = read();
  const counts = state.events.reduce<Record<string, number>>((acc, e) => {
    acc[e.name] = (acc[e.name] ?? 0) + 1;
    return acc;
  }, {});
  return {
    sessionId: state.sessionId,
    testimonialSlides: counts["testimonial_slide"] ?? 0,
    testimonialSwipes: counts["testimonial_swipe"] ?? 0,
    sawTestimonials: (counts["testimonial_view"] ?? 0) > 0,
  };
}
