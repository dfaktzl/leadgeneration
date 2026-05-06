import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Code2,
  GraduationCap,
  Cpu,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  Send,
  Quote,
  Star,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Logo } from "@/components/Logo";
import { track, getEngagementSummary } from "@/lib/analytics";

const RATING_VALUE = 5.0;

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Perth Web & IT Solutions | Veteran Expertise, Honest Prices" },
      {
        name: "description",
        content:
          "Senior IT consultant in Queens Park serving Perth 6000. Custom websites, in-person tutoring, hardware repair & consultancy. 20+ years experience, no subscription traps.",
      },
      { property: "og:title", content: "Premium Web & Tech Solutions — Honest Perth Prices" },
      {
        property: "og:description",
        content:
          "Stop overpaying for monthly website subscriptions. Senior-level IT from a local Perth veteran.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Perth Web & IT Solutions",
          description:
            "Senior IT consultant in Queens Park serving Perth 6000. Custom websites, tutoring, hardware repair & consultancy.",
          areaServed: "Perth, WA 6000",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Queens Park",
            addressRegion: "WA",
            postalCode: "6107",
            addressCountry: "AU",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: RATING_VALUE.toFixed(1),
            bestRating: "5",
            worstRating: "1",
            reviewCount: String(testimonials.length),
          },
          review: testimonials.map((t) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: "5",
              bestRating: "5",
            },
            author: { "@type": "Person", name: t.name },
            reviewBody: t.quote,
          })),
        }),
      },
    ],
  }),
});

const services = [
  {
    icon: Code2,
    title: "Web Development",
    desc: "Professional, fast, SEO-optimised sites. Custom builds you own outright — no subscription traps, no lock-in.",
  },
  {
    icon: GraduationCap,
    title: "In-Person Tutoring",
    desc: "Personalised help with AI tools, software automation, or general computer literacy. All skill levels welcome.",
  },
  {
    icon: Cpu,
    title: "Hardware & Repair",
    desc: "Expert computer repair and custom-spec workstation builds for professionals, creators, and gamers.",
  },
  {
    icon: Briefcase,
    title: "Consultancy",
    desc: "Senior IT strategy and workflow automation. Cut waste, ship faster, scale without the agency overhead.",
  },
];

const testimonials = [
  {
    quote:
      "Cut our website bill in half and the new site loads twice as fast. Wish we'd found him a year ago.",
    name: "Sarah M.",
    role: "Owner, Boutique Retail — Victoria Park",
  },
  {
    quote:
      "Fixed a workstation issue three other techs gave up on. Honest, fast, and explained everything in plain English.",
    name: "David K.",
    role: "Architect — Perth CBD",
  },
  {
    quote:
      "Built our booking site from scratch in under two weeks. We own it outright — no monthly trap. Bookings doubled.",
    name: "Priya R.",
    role: "Director, Wellness Studio — South Perth",
  },
  {
    quote:
      "Patient, clear, and never made me feel silly for asking. I finally understand the AI tools I'm paying for.",
    name: "Margaret T.",
    role: "Tutoring Client — Queens Park",
  },
  {
    quote:
      "Senior-grade consulting at a fraction of the agency quote. Workflow automation paid for itself in a month.",
    name: "James L.",
    role: "Operations Lead, Logistics SME",
  },
];

const trustBadges = [
  { icon: MapPin, label: "Based in Queens Park" },
  { icon: Users, label: "Serving Perth 6000" },
  { icon: Clock, label: "20+ Years Experience" },
  { icon: Wrench, label: "In-Person Support" },
];

function Index() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const testimonialsRef = useRef<HTMLDivElement | null>(null);
  const quoteRef = useRef<HTMLDivElement | null>(null);

  // Observe section views
  useEffect(() => {
    const targets: Array<[HTMLElement | null, "testimonial_view" | "quote_form_view"]> = [
      [testimonialsRef.current, "testimonial_view"],
      [quoteRef.current, "quote_form_view"],
    ];
    const seen = new Set<string>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const name = (e.target as HTMLElement).dataset.event as
            | "testimonial_view"
            | "quote_form_view"
            | undefined;
          if (e.isIntersecting && name && !seen.has(name)) {
            seen.add(name);
            track(name);
          }
        }
      },
      { threshold: 0.4 }
    );
    targets.forEach(([el, name]) => {
      if (el) {
        el.dataset.event = name;
        obs.observe(el);
      }
    });
    return () => obs.disconnect();
  }, []);

  // Track carousel slide changes (covers swipe, drag, arrow click)
  useEffect(() => {
    if (!carouselApi) return;
    let lastIndex = carouselApi.selectedScrollSnap();
    const onSelect = () => {
      const idx = carouselApi.selectedScrollSnap();
      const isPointer = (carouselApi as unknown as { internalEngine?: () => { dragHandler?: { pointerDown?: () => boolean } } })
        .internalEngine?.()?.dragHandler?.pointerDown?.();
      track("testimonial_slide", {
        from: lastIndex,
        to: idx,
        method: isPointer ? "swipe" : "button",
      });
      if (isPointer) track("testimonial_swipe", { index: idx });
      lastIndex = idx;
    };
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") || "").trim().slice(0, 100),
      email: String(data.get("email") || "").trim().slice(0, 255),
      phone: String(data.get("phone") || "").trim().slice(0, 50) || null,
      service: String(data.get("service") || "").trim().slice(0, 100),
      current_payment: String(data.get("current") || "").trim().slice(0, 200) || null,
      message: String(data.get("message") || "").trim().slice(0, 2000) || null,
    };

    if (!payload.name || !payload.email || !payload.service) {
      toast.error("Please fill in name, email, and service.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("leads").insert(payload);
    setSubmitting(false);

    if (error) {
      console.error("Lead submission failed:", error);
      toast.error("Something went wrong. Please try again or email me directly.");
      return;
    }

    toast.success("Enquiry received — I'll be in touch within 24 hours.");
    form.reset();
    setSubmitted(true);
  };

  const scrollToQuote = () => {
    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-bold tracking-tight text-lg">
            <span className="text-primary">//</span> PerthTech
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#beat" className="hover:text-foreground transition-colors">Beat Your Bill</a>
            <a href="#quote" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <button
            onClick={scrollToQuote}
            className="text-sm font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Get a Quote
          </button>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.18 0.012 250 / 0.85), oklch(0.18 0.012 250 / 0.95)), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-36">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs text-muted-foreground mb-8">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Available for new projects — Perth 6000
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl">
            Premium Web & Tech Solutions.{" "}
            <span className="text-primary">Honest Perth Prices.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Stop overpaying for monthly website subscriptions. Get senior-level IT consulting,
            custom builds, and in-person support from a local veteran with 20+ years of experience.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={scrollToQuote}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
              style={{ boxShadow: "var(--shadow-glow)" }}
            >
              Request a Quote <ArrowRight size={18} />
            </button>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md border border-border bg-card/50 font-semibold hover:bg-card transition"
            >
              See Services
            </a>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustBadges.map((b) => (
            <div key={b.label} className="flex items-center gap-3 text-sm">
              <span className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary">
                <b.icon size={18} />
              </span>
              <span className="font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Beat Your Bill */}
      <section id="beat" className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div
            className="relative rounded-2xl border border-primary/30 p-8 md:p-12 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.22 0.014 250) 0%, oklch(0.26 0.04 200) 100%)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <span className="inline-block text-xs uppercase tracking-widest text-primary font-bold mb-4">
                The Beat-Your-Bill Offer
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
                Currently paying <span className="text-primary">$40+/month</span> for your site? Let
                me beat it.
              </h2>
              <p className="mt-6 text-muted-foreground max-w-2xl text-lg">
                The average Perth small-business website costs <strong className="text-foreground">$50–$150/month</strong> on
                subscription platforms — that's <strong className="text-foreground">$600–$1,800 a year</strong>, forever.
                I'll build you a site you actually own, and quote you a price that beats whatever
                you're paying now. Guaranteed.
              </p>
              <ul className="mt-8 grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  "You own the code and domain",
                  "No recurring subscription lock-in",
                  "Faster, leaner, SEO-ready",
                  "Local in-person support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={scrollToQuote}
                className="mt-10 inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
              >
                Get My Beat-Your-Bill Quote <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 md:py-28 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              Service Portfolio
            </span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
              Senior-level service. No agency markup.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {services.map((s) => (
              <div
                key={s.title}
                className="group p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <s.icon size={24} />
                </span>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              What Clients Say
            </span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
              Trusted by Perth locals & small businesses.
            </h2>
          </div>
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-5">
              {testimonials.map((t) => (
                <CarouselItem
                  key={t.name}
                  className="pl-5 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <figure
                    className="relative h-full p-7 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors flex flex-col"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <Quote size={28} className="text-primary/40 mb-4" />
                    <div className="flex gap-0.5 mb-3" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className="fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-foreground leading-relaxed flex-1">
                      "{t.quote}"
                    </blockquote>
                    <figcaption className="mt-6 pt-5 border-t border-border">
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.role}</div>
                    </figcaption>
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious />
              <CarouselNext />
            </div>
            <p className="md:hidden text-center text-xs text-muted-foreground mt-6">
              Swipe to see more →
            </p>
          </Carousel>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 md:py-28 px-6 border-t border-border bg-card/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-12 items-start">
          <div className="md:col-span-2">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              About
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Trade Precision.<br />Tech Logic.
            </h2>
          </div>
          <div className="md:col-span-3 space-y-5 text-muted-foreground leading-relaxed text-lg">
            <p>
              I started my career in high-end trade — fitting out luxury boats where a single
              millimetre of slop meant the job came back. That standard of precision shaped how I
              approach everything since.
            </p>
            <p>
              Two decades later, after working at the upper end of the IT industry on systems,
              automation, and architecture, I'm pivoting to freelance. The goal: give Perth locals
              and small businesses access to senior-level expertise without paying agency overhead
              or being trapped on a $99/month "website service."
            </p>
            <p>
              The blend of trade reliability and tech mastery means one thing:{" "}
              <span className="text-foreground font-semibold">the job gets done right the first time.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="py-20 md:py-28 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              Enquire for a Quote
            </span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
              Let's talk about your project.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Fill in the form and I'll get back to you within 24 hours with an honest quote.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 rounded-xl bg-card border border-primary/40 text-center">
              <CheckCircle2 size={40} className="text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Enquiry received — thank you.</h3>
              <p className="text-muted-foreground">
                I'll be in touch within 24 hours. For anything urgent, email{" "}
                <a href="mailto:matt@xfer.au" className="text-primary underline">
                  matt@xfer.au
                </a>{" "}
                or call{" "}
                <a href="tel:+61450910100" className="text-primary underline">
                  0450 910 100
                </a>
                .
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="p-6 md:p-8 rounded-xl bg-card border border-border space-y-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <Field name="name" label="Name" required />
                <Field name="email" label="Email" type="email" required />
              </div>
              <Field name="phone" label="Phone (optional)" type="tel" />

              <div>
                <label className="block text-sm font-medium mb-2">Service Needed *</label>
                <select
                  name="service"
                  required
                  className="w-full px-4 py-3 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a service…</option>
                  <option>Web Development</option>
                  <option>In-Person Tutoring</option>
                  <option>Hardware & Repair</option>
                  <option>IT Consultancy</option>
                  <option>Not sure — let's chat</option>
                </select>
              </div>

              <Field
                name="current"
                label="Currently paying for a site? (optional)"
                placeholder="e.g. $79/month with XYZ"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Tell me about your project</label>
                <textarea
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="What are you trying to achieve?"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                {submitting ? "Sending…" : <>Send Enquiry <Send size={18} /></>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Matt — Queens Park, WA 6000
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="tel:+61450910100"
              className="inline-flex items-center gap-2 hover:text-foreground transition"
            >
              <Phone size={16} /> 0450 910 100
            </a>
            <a
              href="mailto:matt@xfer.au"
              className="inline-flex items-center gap-2 hover:text-foreground transition"
            >
              <Mail size={16} /> matt@xfer.au
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && "*"}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
