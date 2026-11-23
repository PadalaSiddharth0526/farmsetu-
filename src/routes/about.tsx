import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Telangana Farmers — Our Mission" },
      { name: "description", content: "Why we built a soil, crop advisory and direct marketplace platform for farmers across Telangana." },
      { property: "og:title", content: "About Telangana Farmers — Our Mission" },
      { property: "og:description", content: "Better soil knowledge and fairer prices for Telangana farmers." },
    ],
  }),
  component: About,
});

function About() {
  const { pick } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold">{pick("About us", "మా గురించి")}</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          {pick(
            "Telangana Farmers is a free platform that helps farmers understand their soil, choose crops that actually suit their land, and sell their harvest straight to customers.",
            "తెలంగాణ రైతులు అనేది రైతులు తమ మట్టిని అర్థం చేసుకోవడానికి, తమ భూమికి సరిపోయే పంటలను ఎంచుకోవడానికి, పంటను నేరుగా కొనుగోలుదారులకు అమ్మడానికి సహాయపడే ఉచిత వేదిక.",
          )}
        </p>
        <p>
          {pick(
            "Most small farmers lose a large share of their income to middlemen and to crop choices that don't match their soil. We combine simple soil analysis, district-aware crop recommendations, and a zero-commission marketplace in one place — in English and Telugu.",
            "చాలా మంది చిన్న రైతులు దళారుల వల్ల, మట్టికి సరిపోని పంటల వల్ల ఆదాయం కోల్పోతున్నారు. సులభమైన మట్టి విశ్లేషణ, జిల్లా ఆధారిత పంట సిఫార్సులు, కమిషన్ లేని మార్కెట్ — అన్నీ ఒకే చోట, ఇంగ్లీష్ మరియు తెలుగులో.",
          )}
        </p>
        <p>
          {pick(
            "Recommendations here are guidance based on agronomy rules and public crop data. Always confirm fertilizer decisions with your local agriculture officer.",
            "ఇక్కడి సిఫార్సులు వ్యవసాయ నియమాలు, ప్రజా పంట సమాచారం ఆధారంగా ఇచ్చిన మార్గదర్శకం మాత్రమే. ఎరువుల నిర్ణయాలను మీ స్థానిక వ్యవసాయ అధికారితో ధృవీకరించండి.",
          )}
        </p>
      </div>
    </div>
  );
}
