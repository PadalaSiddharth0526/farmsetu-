import { useMemo, useState, type FormEvent } from "react";
import advisorJson from "@/data/crop-advisor-data.json?raw";
import { getCropImage } from "@/lib/crop-images";
import { useI18n, type Lang } from "@/lib/i18n";

type CropLists = [string[], string[], string[], string[]];
type CompareGroup = [string[], string[]];

type CompareText = {
  heading: string;
  positive: string;
  negative: string;
  metrics: string;
  note: string;
  groups: Record<string, CompareGroup>;
  special: Record<string, CompareGroup>;
};

type ExtraCategory = {
  districts: string[];
  seasons: [string[], string[]];
  yearRound?: string[];
};

type SoilText = {
  title: string;
  location: string;
  season: string;
  acid: string;
  alkaline: string;
  neutral: string;
  nlow: string;
  nhigh: string;
  plow: string;
  klow: string;
  oclow: string;
  noSoil: string;
  check: string;
};

type AdvisorData = {
  DATA: Record<string, CropLists>;
  photoPaths: Record<string, string>;
  ONLINE_CROP_PHOTOS: Record<string, string>;
  FRUIT_VARIETIES: Record<string, string[]>;
  FRUIT_VARIETY_NOTES: Record<string, string>;
  FRUIT_TELUGU_NAMES: Record<string, string>;
  COMPARE_GROUPS: Record<string, string[]>;
  COMPARE_TEXT: Record<Lang, CompareText>;
  CROP_GUIDANCE: Record<string, string[]>;
  CROP_TELUGU: Record<string, string>;
  TXT: Record<Lang, SoilText>;
  CROP_TELUGU_TIPS: Record<string, string[]>;
  UI_TRANSLATIONS: Record<string, string>;
  CROP_GUIDANCE_ALIASES: Record<string, string>;
  EXTRA_CATEGORIES: Record<"vegetables" | "leafy" | "flowers", ExtraCategory>;
  wetNames: string[];
  dryNames: string[];
};

type AdvisorForm = {
  district: string;
  season: string;
  acres: string;
  previous: string;
  ph: string;
  n: string;
  p: string;
  k: string;
  oc: string;
};

const DATA = JSON.parse(advisorJson) as AdvisorData;
const DEFAULT_DISTRICT = "Siddipet";
const EXCLUDED_SEASON_CROPS = new Set([
  "Vegetables",
  "Leafy Vegetables",
  "Rose/Floriculture",
  "Nursery Ornamentals",
  "Avenue/Fruit Trees",
]);
const PHOTO_ALIASES: Record<string, string> = {
  Urad: "Black Gram",
  "Urad (Black Gram)": "Black Gram",
  Chickpea: "Bengal Gram",
  "Pigeon Pea": "Red Gram",
  "Paddy (Rice)": "Paddy",
  Mosambi: "Sweet Orange",
  Chikoo: "Sapota",
  "Sapota (Chikoo)": "Sapota",
  "Ragi (Finger Millet)": "Ragi",
  "Maize (Corn)": "Maize",
  Cashew: "Cashewnut",
  "Cashew Nut": "Cashewnut",
  "Acid Lime (Lemon)": "Acid Lime",
};

function getValidationErrors(form: AdvisorForm) {
  const errors: string[] = [];
  const ranges: Array<[keyof AdvisorForm, number, number, string]> = [
    ["ph", 4.5, 9, "pH"],
    ["n", 50, 600, "Nitrogen"],
    ["p", 5, 150, "Phosphorus"],
    ["k", 50, 800, "Potassium"],
    ["oc", 0.1, 3, "Organic carbon"],
  ];

  for (const [key, min, max, label] of ranges) {
    const raw = form[key].trim();
    const value = Number(raw);
    if (raw && (!Number.isFinite(value) || value < min || value > max)) {
      errors.push(`${label}: enter ${min}–${max} or leave blank`);
    }
  }

  if (form.acres.trim() && !(Number(form.acres) > 0)) {
    errors.push("Farm size must be positive");
  }
  return errors;
}

function getCropPhoto(crop: string) {
  const key = PHOTO_ALIASES[crop] ?? crop;
  return DATA.photoPaths[key] ?? DATA.ONLINE_CROP_PHOTOS[key] ?? getCropImage(crop)?.src;
}

function translateUi(text: string, lang: Lang) {
  return lang === "te" ? DATA.UI_TRANSLATIONS[text] ?? text : text;
}

function CropPhoto({ crop, lang }: { crop: string; lang: Lang }) {
  const [failed, setFailed] = useState(false);
  const src = getCropPhoto(crop);

  if (!src || failed) {
    return (
      <div className="grid h-full min-h-28 place-items-center bg-secondary px-3 text-center text-xs text-muted-foreground">
        {lang === "te" ? "ఫోటో ఇంకా అందించబడలేదు" : "Photo not yet provided"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${crop} crop`}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function CropCard({
  crop,
  district,
  season,
  soilNotes,
  lang,
  translate,
}: {
  crop: string;
  district: string;
  season: string;
  soilNotes: string[];
  lang: Lang;
  translate: (text: string) => string;
}) {
  const guidanceKey = DATA.CROP_GUIDANCE_ALIASES[crop] ?? crop;
  const cropGuidance =
    lang === "te"
      ? DATA.CROP_TELUGU_TIPS[guidanceKey] ??
        [
          "నీరు నిల్వ ఉండకుండా, పంటకు తగిన తేమను నిర్వహించండి.",
          "పురుగులు, తెగుళ్లను క్రమం తప్పకుండా పరిశీలించి స్థానిక వ్యవసాయ నిపుణుల సలహా తీసుకోండి.",
        ]
      : DATA.CROP_GUIDANCE[guidanceKey] ??
        [
          "Maintain suitable drainage and monitor crop moisture.",
          "Inspect regularly for pests and diseases and seek local extension advice.",
        ];
  const compareGroup = Object.entries(DATA.COMPARE_GROUPS).find(([, crops]) =>
    crops.includes(crop),
  )?.[0] ?? "commercial";
  const compareText = DATA.COMPARE_TEXT[lang];
  const groupComparison = compareText.groups[compareGroup] ?? compareText.groups["commercial"]!;
  const specialComparison = compareText.special[crop];
  const cropName =
    lang === "te"
      ? `${DATA.CROP_TELUGU[crop] ?? DATA.FRUIT_TELUGU_NAMES[crop] ?? crop} (${crop})`
      : crop;
  const seasonLabel =
    lang === "te"
      ? season.startsWith("Kharif")
        ? "వానాకాలం"
        : "యాసంగి"
      : season.startsWith("Kharif")
        ? "Kharif"
        : "Rabi";
  const soilText = DATA.TXT[lang];
  const fruitVarieties = DATA.FRUIT_VARIETIES[crop];
  const varietyNote =
    DATA.FRUIT_VARIETY_NOTES[crop] ??
    "Compare local selling price, expected yield, input cost, water needs and disease risk before selecting a variety. No guaranteed profit ranking.";

  return (
    <article className="cqca-card surface-panel flex min-w-0 flex-col overflow-hidden rounded-2xl">
      <div className="cqca-photo">
        <CropPhoto crop={crop} lang={lang} />
        <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-md bg-background/90 px-2 py-1 text-[10px] text-muted-foreground">
          {translate("Seasonal crop option")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold">{cropName}</h3>
        <details className="mt-3 border-t border-border pt-3 text-xs leading-relaxed">
          <summary className="cursor-pointer font-semibold text-primary">
            {soilText.title}
          </summary>
          <ul className="mt-2 space-y-1.5 text-muted-foreground">
            <li>{soilText.location}: {district} · {soilText.season}: {seasonLabel}</li>
            {cropGuidance.map((tip) => <li key={tip}>{tip}</li>)}
            {soilNotes.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">{soilText.check}</p>
        </details>

        {fruitVarieties && (
          <details className="mt-3 border-t border-border pt-3 text-xs leading-relaxed">
            <summary className="cursor-pointer font-semibold text-primary">
              {lang === "te" ? "వాణిజ్యపరంగా పరిశీలించదగిన పండ్ల రకాలు" : "Fruit varieties to compare for profitability"}
            </summary>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
              {fruitVarieties.map((variety) => <li key={variety}>{variety}</li>)}
            </ol>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {lang === "te"
                ? "ఇవి లాభానికి హామీ ఇచ్చే ర్యాంకింగులు కావు. స్థానిక మార్కెట్ ధర, దిగుబడి, సాగు ఖర్చు, నీటి లభ్యత, వ్యాధుల ప్రమాదం ఆధారంగా రకాన్ని ఎంచుకోండి."
                : varietyNote}
            </p>
          </details>
        )}

        <details className="mt-3 border-t border-border pt-3 text-xs leading-relaxed">
          <summary className="cursor-pointer font-semibold text-primary">{compareText.heading}</summary>
          <p className="mt-2 text-muted-foreground">{compareText.metrics}</p>
          <div className="mt-2 rounded-lg bg-green-50 p-3 text-green-950">
            <strong>{compareText.positive}</strong>
            <ul className="mt-1 list-inside list-disc">
              {[...groupComparison[0], ...(specialComparison?.[0] ?? [])].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="mt-2 rounded-lg bg-orange-50 p-3 text-orange-950">
            <strong>{compareText.negative}</strong>
            <ul className="mt-1 list-inside list-disc">
              {[...groupComparison[1], ...(specialComparison?.[1] ?? [])].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{compareText.note}</p>
        </details>
      </div>
    </article>
  );
}

function CropCategory({
  title,
  description,
  crops,
  district,
  season,
  soilNotes,
  lang,
  translate,
  note,
}: {
  title: string;
  description: string;
  crops: string[];
  district: string;
  season: string;
  soilNotes: string[];
  lang: Lang;
  translate: (text: string) => string;
  note?: string;
}) {
  return (
    <section className="surface-panel min-w-0 rounded-3xl p-4 sm:p-5">
      <h2 className="font-display text-lg font-extrabold sm:text-xl">{translate(title)}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{translate(description)}</p>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
      {crops.length > 0 ? (
        <div className="cqca-cards mt-4">
          {crops.map((crop) => (
            <CropCard
              key={crop}
              crop={crop}
              district={district}
              season={season}
              soilNotes={soilNotes}
              lang={lang}
              translate={translate}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-secondary px-3 py-4 text-sm text-muted-foreground">
          {translate("No crops available for this category")}
        </p>
      )}
    </section>
  );
}

export function CropAdvisor() {
  const { lang } = useI18n();
  const te = lang === "te";
  const translate = (text: string) => translateUi(text, lang);
  const [form, setForm] = useState<AdvisorForm>({
    district: DEFAULT_DISTRICT,
    season: "0",
    acres: "2",
    previous: "Cotton",
    ph: "6.5",
    n: "280",
    p: "25",
    k: "240",
    oc: "0.4",
  });

  function update<K extends keyof AdvisorForm>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  const validationErrors = useMemo(() => getValidationErrors(form), [form]);
  const districtData = DATA.DATA[form.district] ?? DATA.DATA[DEFAULT_DISTRICT]!;
  const seasonIndex = Number(form.season) === 1 ? 1 : 0;
  const excluded = EXCLUDED_SEASON_CROPS;
  const seasonalCrops = districtData[seasonIndex].filter((crop) => !excluded.has(crop));
  const wetCrops = seasonalCrops.filter(
    (crop) => DATA.wetNames.includes(crop) || (!DATA.dryNames.includes(crop) && !DATA.wetNames.includes(crop)),
  );
  const dryCrops = seasonalCrops.filter(
    (crop) => DATA.dryNames.includes(crop) || (!DATA.wetNames.includes(crop) && !DATA.dryNames.includes(crop)),
  );
  const annualCrops = districtData[2].filter((crop) => !excluded.has(crop));
  const perennialCrops = districtData[3].filter(
    (crop) => !["Nursery Ornamentals", "Avenue/Fruit Trees"].includes(crop),
  );
  const soilNotes = useMemo(() => {
    const t = DATA.TXT[lang];
    const values = {
      ph: form.ph.trim() ? Number(form.ph) : null,
      n: form.n.trim() ? Number(form.n) : null,
      p: form.p.trim() ? Number(form.p) : null,
      k: form.k.trim() ? Number(form.k) : null,
      oc: form.oc.trim() ? Number(form.oc) : null,
    };
    const notes: string[] = [];
    if (values.ph !== null) notes.push(values.ph < 6.5 ? t.acid : values.ph > 7.5 ? t.alkaline : t.neutral);
    if (values.n !== null) {
      if (values.n < 200) notes.push(t.nlow);
      else if (values.n > 450) notes.push(t.nhigh);
    }
    if (values.p !== null && values.p < 30) notes.push(t.plow);
    if (values.k !== null && values.k < 150) notes.push(t.klow);
    if (values.oc !== null && values.oc < 0.5) notes.push(t.oclow);
    if (Object.values(values).every((value) => value === null)) notes.push(t.noSoil);
    return notes;
  }, [form.ph, form.n, form.p, form.k, form.oc, lang]);

  const errorMessage = validationErrors.length
    ? `${translate("No crops displayed. Correct the following values:")} ${validationErrors.join("; ")}`
    : "";
  const season = seasonIndex === 0 ? "Kharif (Vanakalam)" : "Rabi (Yasangi)";
  const extraCategoryDetails = {
    vegetables: {
      title: "🥕 Vegetables",
      description: "Only the vegetables in your supplied district-and-season list",
    },
    leafy: {
      title: "🥬 Leafy Vegetables",
      description: "Seasonal leafy vegetables listed for the selected district",
    },
    flowers: {
      title: "🌸 Floriculture (Flowers)",
      description: "Only the flowers in your supplied district-and-season list",
    },
  } as const;

  return (
    <div className="cqca mx-auto max-w-[1600px] px-4 py-7 pb-16 sm:px-6 lg:py-10">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {translate("Which Crop Should I Grow?")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {translate("Choose your district and season. Explore crops for more water, less water, and long-term cultivation.")}
        </p>
      </div>

      <form
        onSubmit={submit}
        noValidate
        className="surface-panel mt-6 grid gap-x-6 gap-y-4 rounded-3xl p-4 sm:p-6 lg:grid-cols-2"
      >
        <label className="block text-sm font-semibold">
          {translate("District")}
          <select
            value={form.district}
            onChange={(event) => update("district", event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal"
          >
            {Object.keys(DATA.DATA).map((district) => <option key={district}>{district}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          {translate("Season")}
          <select
            value={form.season}
            onChange={(event) => update("season", event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal"
          >
            <option value="0">{translate("Kharif (Vanakalam)")}</option>
            <option value="1">{translate("Rabi (Yasangi)")}</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          {translate("Farm size (acres)")}
          <input
            type="number"
            min="0.01"
            step="0.1"
            value={form.acres}
            onChange={(event) => update("acres", event.target.value)}
            className={`mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal ${form.acres && !(Number(form.acres) > 0) ? "border-destructive bg-destructive/5" : "border-input"}`}
          />
        </label>
        <label className="block text-sm font-semibold">
          {translate("Previous crop (optional)")}
          <input
            type="text"
            placeholder={te ? "ఉదా: పత్తి" : "e.g., Cotton"}
            value={form.previous}
            onChange={(event) => update("previous", event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal"
          />
        </label>

        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold">
            {translate("Soil values")}
            <span className="ml-1 font-normal text-muted-foreground">
              {translate("(optional; default values provided)")}
            </span>
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {([
              ["ph", "pH (4.5–9.0)", "4.5", "9", "0.1"],
              ["n", "N kg/ha (50–600)", "50", "600", "1"],
              ["p", "P kg/ha (5–150)", "5", "150", "1"],
              ["k", "K kg/ha (50–800)", "50", "800", "1"],
              ["oc", "Organic C % (0.1–3.0)", "0.1", "3", "0.1"],
            ] as const).map(([key, label, min, max, step]) => {
              const invalid = validationErrors.some((error) =>
                error.toLowerCase().startsWith(
                  ({ ph: "ph", n: "nitrogen", p: "phosphorus", k: "potassium", oc: "organic carbon" } as const)[key],
                ),
              );
              return (
                <label key={key} className="block text-xs font-semibold">
                  {translate(label)}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={form[key]}
                    onChange={(event) => update(key, event.target.value)}
                    className={`mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal ${invalid ? "border-destructive bg-destructive/5" : "border-input"}`}
                  />
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {translate("Prototype accepted-input ranges only; these are not universal crop suitability or soil-health thresholds. Check units and testing methods before using measured values.")}
          </p>
          <button
            type="submit"
            className="mt-4 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {translate("🌱 Show Recommended Crops")}
          </button>
        </div>
      </form>

      {errorMessage && (
        <p role="alert" className="mt-5 rounded-xl border border-destructive bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {!validationErrors.length && (
        <div className="mt-8">
          <h2 className="font-display text-2xl font-extrabold">
            {te
              ? `పంట సూచనలు — ${form.district}`
              : `Crop candidates for ${form.district} — ${season}`}
          </h2>
          <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            {te
              ? "సూచన మాత్రమే: పంటల జాబితాలు అందించిన డేటా ఆధారంగా ఉన్నాయి; స్వతంత్రంగా ధృవీకరించబడలేదు. ఇవి సీజన్ అభ్యర్థులు మాత్రమే—సిఫార్సులు, దిగుబడి అంచనాలు, లాభ ర్యాంకింగులు లేదా ML అంచనాలు కావు. స్థానికంగా నిర్ధారించండి."
              : "Reference only: crop lists come from the supplied data and are not independently verified. These are seasonal candidates—not verified recommendations, yield forecasts, profit rankings, or ML predictions. Confirm suitability locally."}
          </p>
          <div className="mt-5 grid gap-5">
            <CropCategory
              title="💧 More Water Available (Irrigated)"
              description="Seasonal crop candidates to evaluate when adequate irrigation is available"
              crops={wetCrops}
              district={form.district}
              season={season}
              soilNotes={soilNotes}
              lang={lang}
              translate={translate}
            />
            <CropCategory
              title="☀️ Less Water Available (Rainfed)"
              description="Seasonal crop candidates to evaluate when irrigation is limited"
              crops={dryCrops}
              district={form.district}
              season={season}
              soilNotes={soilNotes}
              lang={lang}
              translate={translate}
            />
            <div className="grid gap-5 xl:grid-cols-2">
              <CropCategory
                title="🌿 Annual Crops (9–12 Months)"
                description="All listed annual crop candidates for this district"
                crops={annualCrops}
                district={form.district}
                season={season}
                soilNotes={soilNotes}
                lang={lang}
                translate={translate}
              />
              <CropCategory
                title="🌳 Perennial Crops (Multi-Year)"
                description="All listed perennial crop candidates for this district"
                crops={perennialCrops}
                district={form.district}
                season={season}
                soilNotes={soilNotes}
                lang={lang}
                translate={translate}
              />
            </div>
            <div className="grid gap-5">
              {(Object.keys(extraCategoryDetails) as Array<keyof typeof extraCategoryDetails>).map((key) => {
                  const category = extraCategoryDetails[key];
                  const source = DATA.EXTRA_CATEGORIES[key];
                  const crops = [
                    ...source.seasons[seasonIndex],
                    ...(source.yearRound ?? []),
                  ];
                  const isPrimary = source.districts.includes(form.district);
                  const note = isPrimary
                    ? te
                      ? "ఈ జిల్లా అందించిన పంటల మూల జాబితాలో ఉంది."
                      : "This district is listed in the supplied crop source."
                    : te
                      ? "పరిశీలన కోసం మాత్రమే; ఈ జిల్లాకు ధృవీకరించబడలేదు."
                      : "Exploratory options only; not verified for this district.";
                  return (
                    <CropCategory
                      key={key}
                      title={category.title}
                      description={category.description}
                      crops={crops}
                      district={form.district}
                      season={season}
                      soilNotes={soilNotes}
                      lang={lang}
                      translate={translate}
                      note={note}
                    />
                  );
                })}
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            {translate("Uploaded crop photographs are embedded locally where available. Confirm crop suitability with local agricultural extension services before planting.")}
          </p>
        </div>
      )}
    </div>
  );
}
