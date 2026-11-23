import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Store, TrendingUp, ShieldCheck, Languages, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-farm.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmSetu — Bridging Farms and Communities." },
      {
        name: "description",
        content:
          "Free soil health analysis and a direct farmer-to-customer marketplace across Telangana.",
      },
      { property: "og:title", content: "FarmSetu — Bridging Farms and Communities." },
      {
        property: "og:description",
        content: "Test your soil and sell your harvest directly to customers.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, pick } = useI18n();

  const { data: products } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, farmers(name, district, village)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as unknown as ProductRow[];
    },
  });

  const steps = [
    {
      Icon: FlaskConical,
      title: pick("1. Test your soil", "1. మట్టి పరీక్ష"),
      body: pick(
        "Enter your soil values or upload a lab report. Get an instant soil health score.",
        "మీ మట్టి విలువలు నమోదు చేయండి లేదా ల్యాబ్ నివేదిక అప్‌లోడ్ చేయండి. వెంటనే మట్టి ఆరోగ్య స్కోరు పొందండి.",
      ),
      to: "/soil-test" as const,
    },
    {
      Icon: Store,
      title: pick("2. Sell directly", "2. నేరుగా అమ్మండి"),
      body: pick(
        "List your harvest and sell straight to customers — no middlemen taking your margin.",
        "మీ పంటను జాబితా చేసి నేరుగా కొనుగోలుదారులకు అమ్మండి — దళారులు లేరు.",
      ),
      to: "/farmer/sell" as const,
    },
  ];

  const benefits = [
    {
      Icon: TrendingUp,
      title: pick("Better prices", "మంచి ధరలు"),
      body: pick("Farmers set their own price and keep the full amount.", "రైతులే ధర నిర్ణయిస్తారు, పూర్తి మొత్తం వారికే."),
    },
    {
      Icon: ShieldCheck,
      title: pick("Fresh and traceable", "తాజా, నమ్మకమైన"),
      body: pick("Every product shows the farmer, village and harvest date.", "ప్రతి ఉత్పత్తికి రైతు, గ్రామం, కోత తేదీ కనిపిస్తుంది."),
    },
    {
      Icon: Languages,
      title: pick("English & Telugu", "ఇంగ్లీష్ & తెలుగు"),
      body: pick("Switch language anytime — built for village users.", "ఎప్పుడైనా భాష మార్చుకోండి — గ్రామాల కోసమే."),
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Farmer walking between paddy and cotton fields in Telangana at sunrise"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-background/90 px-4 py-1.5 text-xs font-bold tracking-wide text-primary uppercase">
              {pick("Made for Telangana", "తెలంగాణ కోసం")}
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">{t("heroSub")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-14 text-base">
                <Link to="/soil-test">
                  <FlaskConical className="mr-2 h-5 w-5" />
                  {t("testMySoil")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="harvest" className="h-14 text-base">
                <Link to="/marketplace">
                  <Store className="mr-2 h-5 w-5" />
                  {t("buyFresh")}
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/85">
              <span>🌾 {pick("33 districts covered", "33 జిల్లాలు")}</span>
              <span>🧪 {pick("Free soil analysis", "ఉచిత మట్టి విశ్లేషణ")}</span>
              <span>🚜 {pick("Zero commission", "కమిషన్ లేదు")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold">{t("howItWorks")}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {pick(
            "Two simple steps from soil to sale.",
            "మట్టి నుంచి అమ్మకం వరకు రెండు సులభ దశలు.",
          )}
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {steps.map(({ Icon, title, body, to }) => (
            <Link key={title} to={to} className="surface-panel group rounded-3xl p-6 transition-shadow hover:shadow-lg">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
                {pick("Open", "తెరవండి")} <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-bold">{pick("Fresh from the farm", "పొలం నుంచి తాజాగా")}</h2>
              <p className="mt-2 text-muted-foreground">
                {pick("Bought directly from Telangana farmers.", "తెలంగాణ రైతుల నుంచి నేరుగా.")}
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/marketplace">{pick("See all", "అన్నీ చూడండి")}</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(products ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map(({ Icon, title, body }) => (
            <div key={title} className="surface-panel rounded-3xl p-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-4xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="font-display text-3xl font-bold">
            {pick("Join as a farmer today", "ఈరోజే రైతుగా చేరండి")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            {pick(
              "Register free, test your soil, and start selling your harvest to customers across Telangana.",
              "ఉచితంగా నమోదు చేసుకోండి, మట్టి పరీక్షించండి, తెలంగాణ అంతటా మీ పంటను అమ్మండి.",
            )}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="harvest" className="h-13">
              <Link to="/auth" search={{ role: "farmer" }}>
                {t("iAmFarmer")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-13">
              <Link to="/auth" search={{ role: "customer" }}>
                {t("iAmCustomer")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
