import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Telangana Farmers" },
      { name: "description", content: "From soil test to crop advice to direct sale: how Telangana Farmers works for farmers and customers." },
      { property: "og:title", content: "How It Works — Telangana Farmers" },
      { property: "og:description", content: "Soil test, crop advice and direct selling explained step by step." },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  const { t, pick } = useI18n();

  const farmerSteps = [
    [pick("Register free", "ఉచితంగా నమోదు"), pick("Create a farmer account with your village and district.", "మీ గ్రామం, జిల్లాతో రైతు ఖాతా సృష్టించండి.")],
    [pick("Test your soil", "మట్టి పరీక్ష"), pick("Enter your soil card values and get a health score with fertilizer advice.", "మట్టి కార్డు విలువలు నమోదు చేసి ఆరోగ్య స్కోరు, ఎరువుల సలహా పొందండి.")],
    [pick("Pick the right crop", "సరైన పంట ఎంచుకోండి"), pick("See crops ranked for your soil, season and water.", "మీ మట్టి, సీజన్, నీటికి తగిన పంటలు చూడండి.")],
    [pick("List and sell", "జాబితా చేసి అమ్మండి"), pick("Add your harvest with your own price and get orders directly.", "మీ ధరతో పంటను చేర్చి నేరుగా ఆర్డర్లు పొందండి.")],
  ];

  const customerSteps = [
    [pick("Browse the market", "మార్కెట్ చూడండి"), pick("Filter by crop, district, price and organic produce.", "పంట, జిల్లా, ధర, సేంద్రియ ఆధారంగా వడపోయండి.")],
    [pick("Order directly", "నేరుగా ఆర్డర్"), pick("Add to cart and place a cash-on-delivery order.", "బండిలో చేర్చి డెలివరీ సమయంలో నగదు ఆర్డర్ పెట్టండి.")],
    [pick("Track it", "ట్రాక్ చేయండి"), pick("Follow your order from accepted to delivered.", "ఆర్డర్ అంగీకారం నుంచి డెలివరీ వరకు చూడండి.")],
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold">{t("howItWorks")}</h1>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">{pick("For farmers", "రైతుల కోసం")}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {farmerSteps.map(([title, body], i) => (
            <li key={title} className="surface-panel rounded-3xl p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
              <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">{pick("For customers", "కొనుగోలుదారుల కోసం")}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {customerSteps.map(([title, body], i) => (
            <li key={title} className="surface-panel rounded-3xl p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-harvest font-bold text-harvest-foreground">{i + 1}</span>
              <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg"><Link to="/soil-test">{t("testMySoil")}</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/marketplace">{t("buyFresh")}</Link></Button>
      </div>
    </div>
  );
}
