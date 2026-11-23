import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FlaskConical, Upload, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { SOIL_TYPES } from "@/lib/telangana";
import { analyzeSoil, validateSoilInput, type SoilAnalysis, type SoilInput, type Status } from "@/lib/agronomy";
import { supabase } from "@/integrations/supabase/client";
import { useMyFarmer, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/soil-test")({
  head: () => ({
    meta: [
      { title: "Free Soil Health Test — Telangana Farmers" },
      {
        name: "description",
        content: "Enter your soil pH, NPK and organic carbon values to get an instant soil health score and fertilizer guidance.",
      },
      { property: "og:title", content: "Free Soil Health Test — Telangana Farmers" },
      { property: "og:description", content: "Instant soil health score and fertilizer guidance for Telangana farms." },
    ],
  }),
  component: SoilTestPage,
});

const FIELDS = [
  { key: "ph", label: "pH level", te: "pH స్థాయి", unit: "", placeholder: "6.5", hint: "Ideal 6.0 – 7.5" },
  { key: "nitrogen", label: "Nitrogen (N)", te: "నత్రజని (N)", unit: "kg/ha", placeholder: "280", hint: "Ideal above 280" },
  { key: "phosphorus", label: "Phosphorus (P)", te: "భాస్వరం (P)", unit: "kg/ha", placeholder: "25", hint: "Ideal above 25" },
  { key: "potassium", label: "Potassium (K)", te: "పొటాషియం (K)", unit: "kg/ha", placeholder: "240", hint: "Ideal above 240" },
  { key: "organic_carbon", label: "Organic carbon", te: "సేంద్రియ కర్బనం", unit: "%", placeholder: "0.6", hint: "Ideal above 0.75%" },
  { key: "electrical_conductivity", label: "Electrical conductivity", te: "విద్యుత్ వాహకత", unit: "dS/m", placeholder: "0.4", hint: "Below 1.0 is safe" },
  { key: "moisture", label: "Moisture", te: "తేమ", unit: "%", placeholder: "20", hint: "Optional" },
] as const;

const STATUS_STYLE: Record<Status, string> = {
  good: "bg-good/15 text-good border-good/30",
  medium: "bg-medium/15 text-medium border-medium/30",
  low: "bg-low/15 text-low border-low/30",
  high: "bg-low/15 text-low border-low/30",
  not_assessed: "bg-muted text-muted-foreground border-border",
};

function SoilTestPage() {
  const { t, pick, lang } = useI18n();
  const { data: session } = useSession();
  const { data: farmer } = useMyFarmer();
  const queryClient = useQueryClient();

  const [values, setValues] = useState<Record<string, string>>({});
  const [soilType, setSoilType] = useState<string>("Red Soil");
  const [analysis, setAnalysis] = useState<SoilAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function buildInput(): SoilInput {
    const n = (k: string) => (values[k] != null && values[k] !== "" ? Number(values[k]) : null);
    return {
      ph: n("ph"),
      nitrogen: n("nitrogen"),
      phosphorus: n("phosphorus"),
      potassium: n("potassium"),
      organic_carbon: n("organic_carbon"),
      electrical_conductivity: n("electrical_conductivity"),
      moisture: n("moisture"),
      soil_type: soilType,
    };
  }

  function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const input = buildInput();
    const validationErrors = validateSoilInput(input);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }
    const result = analyzeSoil(input);
    setAnalysis(result);
    if (typeof window !== "undefined") {
      window.setTimeout(() => document.getElementById("soil-result")?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  async function saveReport() {
    if (!farmer || !analysis) return;
    setSaving(true);
    const input = buildInput();
    const { error } = await supabase.from("soil_tests").insert({
      farmer_id: farmer.id,
      ph: input.ph ?? null,
      nitrogen: input.nitrogen ?? null,
      phosphorus: input.phosphorus ?? null,
      potassium: input.potassium ?? null,
      organic_carbon: input.organic_carbon ?? null,
      electrical_conductivity: input.electrical_conductivity ?? null,
      moisture: input.moisture ?? null,

      soil_type: soilType,
      soil_score: analysis.score,
      analysis: JSON.parse(JSON.stringify(analysis)),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["soil-tests"] });
    toast.success(pick("Soil report saved to your dashboard", "మట్టి నివేదిక మీ డాష్‌బోర్డ్‌లో సేవ్ అయ్యింది"));
  }

  async function uploadReport(file: File) {
    if (!session) {
      toast.error(pick("Please sign in to upload a report", "నివేదిక అప్‌లోడ్ చేయడానికి లాగిన్ అవ్వండి"));
      return;
    }
    setUploading(true);
    const path = `${session.user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("soil-reports").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      pick("Report uploaded. Enter the values below to analyse.", "నివేదిక అప్‌లోడ్ అయ్యింది. విలువలు కింద నమోదు చేయండి."),
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary uppercase">
          <FlaskConical className="h-3.5 w-3.5" /> {t("soilTest")}
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
          {pick("Check your soil health for free", "మీ మట్టి ఆరోగ్యాన్ని ఉచితంగా తెలుసుకోండి")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {pick(
            "Type in the values from your soil health card. Leave anything you don't know blank.",
            "మీ మట్టి ఆరోగ్య కార్డులోని విలువలను నమోదు చేయండి. తెలియనివి ఖాళీగా వదిలేయండి.",
          )}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <form onSubmit={onAnalyze} className="surface-panel rounded-3xl p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key}>
                  {pick(f.label, f.te)} {f.unit && <span className="text-muted-foreground">({f.unit})</span>}
                </Label>
                <Input
                  id={f.key}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  max={f.key === "ph" ? 14 : f.key === "organic_carbon" || f.key === "moisture" ? 100 : undefined}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="mt-1.5 h-12"
                />
                <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>
              </div>
            ))}
            <div>
              <Label>{t("soilType")}</Label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger className="mt-1.5 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOIL_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full">
            {t("analyzeSoil")}
          </Button>

          <div className="mt-6 rounded-2xl border border-dashed border-border p-5 text-center">
            <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">{t("uploadSoil")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pick("PDF or photo of your soil health card (optional)", "మట్టి ఆరోగ్య కార్డు PDF లేదా ఫోటో (ఐచ్ఛికం)")}
            </p>
            <Input
              type="file"
              accept="image/*,application/pdf"
              disabled={uploading}
              className="mx-auto mt-3 max-w-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadReport(file);
              }}
            />
          </div>
        </form>

        <div id="soil-result">
          {analysis ? (
            <div className="surface-panel rounded-3xl p-6">
              <h2 className="font-display text-2xl font-bold">{t("soilHealthReport")}</h2>

              <div className="mt-5 rounded-2xl bg-secondary p-5">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {pick("Soil health score", "మట్టి ఆరోగ్య స్కోరు")}
                  </span>
                  <span className="font-display text-4xl font-extrabold text-primary">
                    {analysis.score == null ? "—" : `${analysis.score}/100`}
                  </span>
                </div>
                <Progress value={analysis.score ?? 0} className="mt-3" />
                <p className="mt-3 text-sm">{lang === "te" ? analysis.summaryTe : analysis.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {pick(
                    `${analysis.assessed_parameters} of 6 scoreable soil results assessed. Missing values are not treated as medium.`,
                    `6లో ${analysis.assessed_parameters} మట్టి ఫలితాలు అంచనా వేశాము. నమోదు చేయని విలువలను మధ్యస్థంగా పరిగణించము.`,
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pick(
                    "This is a screening aid, not a laboratory diagnosis or fertilizer prescription. Confirm amendments with your soil lab or local agriculture extension officer.",
                    "ఇది ప్రాథమిక అంచనా మాత్రమే; ప్రయోగశాల నిర్ధారణ లేదా ఎరువుల మోతాదు కాదు. సవరణలను మట్టి ప్రయోగశాల లేదా స్థానిక వ్యవసాయ విస్తరణ అధికారితో నిర్ధారించండి.",
                  )}
                </p>
              </div>

              <ul className="mt-5 space-y-3">
                {analysis.parameters.map((p) => (
                  <li key={p.key} className={cn("rounded-2xl border p-4", STATUS_STYLE[p.status])}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">{lang === "te" ? p.labelTe : p.label}</span>
                      <span className="text-sm font-bold">
                        {p.value ?? "—"} {p.unit}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground/80">
                      {lang === "te" ? p.explanationTe : p.explanation}
                    </p>
                    {(lang === "te" ? p.suggestionTe : p.suggestion) && (
                      <p className="mt-2 rounded-xl bg-background/70 p-2.5 text-sm text-foreground">
                        💡 {lang === "te" ? p.suggestionTe : p.suggestion}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              {farmer && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" variant="outline" onClick={saveReport} disabled={saving}>
                    {pick("Save report", "నివేదిక సేవ్ చేయండి")}
                  </Button>
                </div>
              )}

              <p className="mt-5 flex gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" />
                {t("disclaimer")}
              </p>
            </div>
          ) : (
            <div className="surface-panel grid place-items-center rounded-3xl p-10 text-center">
              <FlaskConical className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                {pick(
                  "Your soil health report will appear here after you analyse your values.",
                  "మీ విలువలు విశ్లేషించిన తర్వాత మట్టి ఆరోగ్య నివేదిక ఇక్కడ కనిపిస్తుంది.",
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
