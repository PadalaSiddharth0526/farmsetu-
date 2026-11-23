/**
 * Rule-based agronomy engine.
 *
 * This module is intentionally pure and framework-free so it can later be
 * replaced by (or blended with) a trained ML model without touching the UI.
 * Inputs and outputs are stable contracts: SoilInput -> SoilAnalysis,
 * RecommendationInput -> CropRecommendation[].
 */

import { getDistrictSeasonCrops, matchesDistrictCrop } from "@/lib/district-crop-guidance";

export type SoilInput = {
  ph?: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  organic_carbon?: number | null;
  electrical_conductivity?: number | null;
  soil_type?: string | null;
  moisture?: number | null;
};

export type Status = "good" | "medium" | "low" | "high" | "not_assessed";

export type ParameterResult = {
  key: string;
  label: string;
  labelTe: string;
  value: number | null;
  unit: string;
  status: Status;
  explanation: string;
  explanationTe: string;
  suggestion?: string | undefined;
  suggestionTe?: string | undefined;
};

export type SoilAnalysis = {
  score: number | null;
  assessed_parameters: number;
  summary: string;
  summaryTe: string;
  parameters: ParameterResult[];
};

const S = {
  good: "good" as Status,
  medium: "medium" as Status,
  low: "low" as Status,
  high: "high" as Status,
  notAssessed: "not_assessed" as Status,
};

function band(value: number | null | undefined, lowMax: number, medMax: number): Status {
  if (value == null || Number.isNaN(value)) return S.notAssessed;
  if (value < lowMax) return S.low;
  if (value < medMax) return S.medium;
  return S.good;
}

export function analyzeSoil(input: SoilInput): SoilAnalysis {
  const params: ParameterResult[] = [];

  // pH
  const ph = num(input.ph);
  const phStatus: Status = ph == null ? S.notAssessed : ph < 5.5 ? S.low : ph > 8.2 ? S.high : ph >= 6.2 && ph <= 7.8 ? S.good : S.medium;
  params.push({
    key: "ph",
    label: "Soil pH",
    labelTe: "మట్టి pH",
    value: ph,
    unit: "",
    status: phStatus,
    explanation:
      phStatus === "not_assessed"
        ? "Enter a soil pH value to assess acidity or alkalinity."
        : phStatus === "good"
        ? "Your soil is balanced — most Telangana crops grow well in this range."
        : phStatus === "low"
          ? "Your soil is on the acidic side. Crops may not take up nutrients easily."
          : phStatus === "high"
            ? "Your soil is alkaline. Some nutrients get locked and plants cannot use them."
            : "Your soil pH is slightly off the ideal range.",
    explanationTe:
      phStatus === "not_assessed"
        ? "ఆమ్లత్వం లేదా క్షారత్వాన్ని అంచనా వేయడానికి మట్టి pH విలువను నమోదు చేయండి."
        : phStatus === "good"
        ? "మీ మట్టి సమతుల్యంగా ఉంది — చాలా పంటలు బాగా పెరుగుతాయి."
        : phStatus === "low"
          ? "మీ మట్టి ఆమ్లంగా ఉంది. పంటలు పోషకాలను సరిగా తీసుకోలేవు."
          : phStatus === "high"
            ? "మీ మట్టి క్షారంగా ఉంది. కొన్ని పోషకాలు మొక్కలకు అందవు."
            : "మీ మట్టి pH కొద్దిగా ఆదర్శ స్థాయికి దూరంగా ఉంది.",
    suggestion:
      phStatus === "low"
        ? "Agricultural lime may help. Adding well-rotted farm yard manure also improves it slowly."
        : phStatus === "high"
          ? "Gypsum and green manure crops such as dhaincha may help reduce alkalinity."
          : undefined,
    suggestionTe:
      phStatus === "low"
        ? "సున్నం వేయడం సహాయపడవచ్చు. బాగా మురిగిన పశువుల ఎరువు కూడా మెరుగుపరుస్తుంది."
        : phStatus === "high"
          ? "జిప్సం మరియు జీలుగ వంటి పచ్చిరొట్ట పంటలు సహాయపడవచ్చు."
          : undefined,
  });

  // Nitrogen kg/ha
  const n = num(input.nitrogen);
  const nStatus = band(n, 240, 480);
  params.push({
    key: "nitrogen",
    label: "Nitrogen (N)",
    labelTe: "నత్రజని (N)",
    value: n,
    unit: "kg/ha",
    status: nStatus,
    explanation:
      nStatus === "not_assessed"
        ? "No nitrogen result was entered; this parameter is not assessed."
        : nStatus === "good"
        ? "Nitrogen is sufficient. Leaves and stems should grow healthy."
        : nStatus === "medium"
          ? "Nitrogen is moderate. A split top dressing during growth may help."
          : "Nitrogen is low. Plants may look pale yellow and grow slowly.",
    explanationTe:
      nStatus === "not_assessed"
        ? "నత్రజని ఫలితం నమోదు చేయలేదు; ఈ అంశాన్ని అంచనా వేయలేదు."
        : nStatus === "good"
        ? "నత్రజని సరిపడా ఉంది. ఆకులు, కాండం ఆరోగ్యంగా పెరుగుతాయి."
        : nStatus === "medium"
          ? "నత్రజని మధ్యస్థంగా ఉంది. పెరుగుదల సమయంలో పైపాటుగా వేయడం మంచిది."
          : "నత్రజని తక్కువ. మొక్కలు పసుపు రంగులోకి మారి నెమ్మదిగా పెరగవచ్చు.",
    suggestion: nStatus === "low" || nStatus === "medium" ? "Discuss nutrient management with a local agriculture extension officer." : undefined,
    suggestionTe: nStatus === "low" || nStatus === "medium" ? "పోషక నిర్వహణ గురించి స్థానిక వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి." : undefined,
  });

  // Phosphorus kg/ha
  const p = num(input.phosphorus);
  const pStatus = band(p, 23, 57);
  params.push({
    key: "phosphorus",
    label: "Phosphorus (P)",
    labelTe: "భాస్వరం (P)",
    value: p,
    unit: "kg/ha",
    status: pStatus,
    explanation:
      pStatus === "not_assessed"
        ? "No phosphorus result was entered; this parameter is not assessed."
        : pStatus === "good"
        ? "Phosphorus is sufficient for good root and flower development."
        : pStatus === "medium"
          ? "Phosphorus is moderate. A basal dose at sowing is advisable."
          : "Phosphorus is low. Roots and flowering may be weak.",
    explanationTe:
      pStatus === "not_assessed"
        ? "భాస్వరం ఫలితం నమోదు చేయలేదు; ఈ అంశాన్ని అంచనా వేయలేదు."
        : pStatus === "good"
        ? "భాస్వరం సరిపడా ఉంది. వేర్లు, పూత బాగుంటాయి."
        : pStatus === "medium"
          ? "భాస్వరం మధ్యస్థం. విత్తే సమయంలో వేయడం మంచిది."
          : "భాస్వరం తక్కువ. వేర్లు, పూత బలహీనంగా ఉండవచ్చు.",
    suggestion: pStatus === "low" || pStatus === "medium" ? "Discuss phosphorus management with a local agriculture extension officer." : undefined,
    suggestionTe: pStatus === "low" || pStatus === "medium" ? "భాస్వరం నిర్వహణ గురించి స్థానిక వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి." : undefined,
  });

  // Potassium kg/ha
  const k = num(input.potassium);
  const kStatus = band(k, 145, 337);
  params.push({
    key: "potassium",
    label: "Potassium (K)",
    labelTe: "పొటాషియం (K)",
    value: k,
    unit: "kg/ha",
    status: kStatus,
    explanation:
      kStatus === "not_assessed"
        ? "No potassium result was entered; this parameter is not assessed."
        : kStatus === "good"
        ? "Potassium is sufficient. Crops should handle heat and stress better."
        : kStatus === "medium"
          ? "Potassium is moderate. Consider a maintenance dose."
          : "Potassium is low. Grain filling and fruit quality may suffer.",
    explanationTe:
      kStatus === "not_assessed"
        ? "పొటాషియం ఫలితం నమోదు చేయలేదు; ఈ అంశాన్ని అంచనా వేయలేదు."
        : kStatus === "good"
        ? "పొటాషియం సరిపడా ఉంది. పంట వేడిని తట్టుకుంటుంది."
        : kStatus === "medium"
          ? "పొటాషియం మధ్యస్థం. కొంత మోతాదు వేయడం మంచిది."
          : "పొటాషియం తక్కువ. గింజ నాణ్యత తగ్గవచ్చు.",
    suggestion: kStatus === "low" || kStatus === "medium" ? "Discuss potassium management with a local agriculture extension officer." : undefined,
    suggestionTe: kStatus === "low" || kStatus === "medium" ? "పొటాషియం నిర్వహణ గురించి స్థానిక వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి." : undefined,
  });

  // Organic carbon %
  const oc = num(input.organic_carbon);
  const ocStatus = band(oc, 0.5, 0.75);
  params.push({
    key: "organic_carbon",
    label: "Organic Carbon",
    labelTe: "సేంద్రియ కర్బనం",
    value: oc,
    unit: "%",
    status: ocStatus,
    explanation:
      ocStatus === "not_assessed"
        ? "No organic carbon result was entered; this parameter is not assessed."
        : ocStatus === "good"
        ? "Your soil has good organic matter and holds water well."
        : ocStatus === "medium"
          ? "Organic matter is moderate. Adding compost each season will help."
          : "Organic matter is low. The soil may harden and dry out quickly.",
    explanationTe:
      ocStatus === "not_assessed"
        ? "సేంద్రియ కర్బన ఫలితం నమోదు చేయలేదు; ఈ అంశాన్ని అంచనా వేయలేదు."
        : ocStatus === "good"
        ? "మీ మట్టిలో సేంద్రియ పదార్థం బాగుంది, నీటిని నిలుపుకుంటుంది."
        : ocStatus === "medium"
          ? "సేంద్రియ పదార్థం మధ్యస్థం. ప్రతి సీజన్‌లో కంపోస్ట్ వేయండి."
          : "సేంద్రియ పదార్థం తక్కువ. మట్టి గట్టిపడి త్వరగా ఎండిపోవచ్చు.",
    suggestion: ocStatus === "low" || ocStatus === "medium" ? "Discuss organic matter management with a local agriculture extension officer." : undefined,
    suggestionTe: ocStatus === "low" || ocStatus === "medium" ? "సేంద్రియ పదార్థ నిర్వహణ గురించి స్థానిక వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి." : undefined,
  });

  // EC dS/m
  const ec = num(input.electrical_conductivity);
  const ecStatus: Status = ec == null ? S.notAssessed : ec <= 1 ? S.good : ec <= 2 ? S.medium : S.high;
  params.push({
    key: "electrical_conductivity",
    label: "Salt level (EC)",
    labelTe: "ఉప్పు స్థాయి (EC)",
    value: ec,
    unit: "dS/m",
    status: ecStatus,
    explanation:
      ecStatus === "not_assessed"
        ? "Enter an EC value to assess soluble salts."
        : ecStatus === "good"
        ? "Salt level is normal — safe for most crops."
        : ecStatus === "medium"
          ? "Salt level is slightly high. Sensitive crops may struggle."
          : "Salt level is high. Water more and choose salt-tolerant crops.",
    explanationTe:
      ecStatus === "not_assessed"
        ? "కరిగే లవణాలను అంచనా వేయడానికి EC విలువను నమోదు చేయండి."
        : ecStatus === "good"
        ? "ఉప్పు స్థాయి సాధారణం — చాలా పంటలకు సురక్షితం."
        : ecStatus === "medium"
          ? "ఉప్పు స్థాయి కొద్దిగా ఎక్కువ. సున్నిత పంటలకు ఇబ్బంది."
          : "ఉప్పు స్థాయి ఎక్కువ. ఉప్పును తట్టుకునే పంటలు ఎంచుకోండి.",
  });

  const moisture = num(input.moisture);
  if (moisture != null) {
    params.push({
      key: "moisture",
      label: "Moisture",
      labelTe: "తేమ",
      value: moisture,
      unit: "%",
      status: S.notAssessed,
      explanation: "Moisture is recorded but not classified without the sensor method, sampling depth, and crop context.",
      explanationTe: "సెన్సార్ పద్ధతి, నమూనా లోతు, పంట వివరాలు లేకుండా తేమను వర్గీకరించలేము.",
    });
  }

  const weights: Record<string, number> = {
    ph: 20,
    nitrogen: 20,
    phosphorus: 18,
    potassium: 17,
    organic_carbon: 15,
    electrical_conductivity: 10,
  };
  const pointsFor = (s: Status) => (s === "good" ? 1 : s === "medium" ? 0.6 : 0.28);
  let total = 0;
  let max = 0;
  let assessedParameters = 0;
  for (const p2 of params) {
    const w = weights[p2.key];
    if (p2.value == null || w == null) continue;
    max += w;
    total += w * pointsFor(p2.status);
    assessedParameters += 1;
  }
  const score = assessedParameters >= 3 ? Math.round((total / max) * 100) : null;

  const summary =
    score == null
      ? "Enter at least three measured soil values for a composite score. Individual values are shown without estimating missing results."
      : score >= 75
      ? "The measured values are mostly within this screening's ranges. Confirm crop-specific plans locally."
      : score >= 50
        ? "The measured values are mixed. Review them with a soil lab or local agriculture extension officer."
        : "Some measured values are outside this screening's ranges. Confirm results before applying amendments.";
  const summaryTe =
    score == null
      ? "మిశ్రమ స్కోరు కోసం కనీసం మూడు మట్టి విలువలను నమోదు చేయండి. నమోదు చేయని విలువలను అంచనా వేయకుండా అందుబాటులో ఉన్నవి చూపిస్తాము."
      : score >= 75
      ? "కొలిచిన విలువలు ఈ ప్రాథమిక అంచనా పరిధుల్లో ఉన్నాయి. పంట ప్రణాళికను స్థానికంగా నిర్ధారించండి."
      : score >= 50
        ? "కొలిచిన విలువలు మిశ్రమంగా ఉన్నాయి. మట్టి ప్రయోగశాల లేదా స్థానిక వ్యవసాయ విస్తరణ అధికారితో సమీక్షించండి."
        : "కొన్ని కొలిచిన విలువలు ఈ ప్రాథమిక అంచనా పరిధులకు వెలుపల ఉన్నాయి. సవరణలు చేసే ముందు ఫలితాలను నిర్ధారించండి.";

  return { score, assessed_parameters: assessedParameters, summary, summaryTe, parameters: params };
}

export function validateSoilInput(input: SoilInput): string[] {
  type NumericSoilKey =
    | "ph"
    | "nitrogen"
    | "phosphorus"
    | "potassium"
    | "organic_carbon"
    | "electrical_conductivity"
    | "moisture";
  const rules: Array<{ key: NumericSoilKey; label: string; min: number; max?: number }> = [
    { key: "ph", label: "pH", min: 0, max: 14 },
    { key: "nitrogen", label: "Nitrogen", min: 0 },
    { key: "phosphorus", label: "Phosphorus", min: 0 },
    { key: "potassium", label: "Potassium", min: 0 },
    { key: "organic_carbon", label: "Organic carbon", min: 0, max: 100 },
    { key: "electrical_conductivity", label: "Electrical conductivity", min: 0 },
    { key: "moisture", label: "Moisture", min: 0, max: 100 },
  ];
  const errors = rules.flatMap(({ key, label, min, max }) => {
    const value = input[key];
    if (value == null) return [];
    if (!Number.isFinite(value)) return [`${label} must be a number.`];
    if (value < min || (max != null && value > max)) {
      return [`${label} must be between ${min} and ${max}.`].map((message) =>
        max == null ? `${label} must be at least ${min}.` : message,
      );
    }
    return [];
  });
  const measured = rules.some(({ key }) => input[key] != null && Number.isFinite(input[key]));
  if (!measured) errors.unshift("Enter at least one valid soil result.");
  return errors;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* -------------------------------------------------------------------------- */
/* Crop recommendation                                                         */
/* -------------------------------------------------------------------------- */

export type RecommendationInput = SoilInput & {
  district?: string | null;
  season?: string | null;
  water?: string | null;
  farm_size?: number | null;
  previous_crop?: string | null;
  preference?: string | null;
};

export type CropRecommendation = {
  crop_name: string;
  crop_name_te: string;
  suitability_score: number;
  district_season_listed: boolean;
  soil_suitability: boolean | null;
  water_suitability: boolean | null;
  reasons: string[];
  reasons_te: string[];
  duration_days: string;
  water_requirement: string;
  soil_requirement: string;
  yield_range: string;
  guidance: string;
  market_demand: string;
  category: string;
};

export type CropProfile = {
  name: string;
  nameTe: string;
  category: string;
  ph: [number, number];
  n: number;
  p: number;
  k: number;
  soils: string[];
  seasons: string[];
  water: "Low" | "Medium" | "High";
  duration: string;
  yieldRange: string;
  guidance: string;
  demand: string;
  soilReq: string;
};

export const CROP_PROFILES: CropProfile[] = [
  {
    name: "Cotton", nameTe: "పత్తి", category: "commercial",
    ph: [6.0, 8.0], n: 220, p: 20, k: 200,
    soils: ["Black Soil", "Red Soil", "Clay Loam"], seasons: ["Kharif (Jun–Oct)"], water: "Medium",
    duration: "150–180 days", yieldRange: "8–12 quintals per acre",
    guidance: "Sow with the first good rains, keep 90x60 cm spacing and watch for pink bollworm from flowering.",
    demand: "Strong demand from Warangal, Adilabad and Khammam ginning mills.",
    soilReq: "Deep black or well drained red soils",
  },
  {
    name: "Maize", nameTe: "మొక్కజొన్న", category: "grains",
    ph: [5.8, 7.8], n: 260, p: 25, k: 180,
    soils: ["Red Soil", "Sandy Loam", "Alluvial", "Clay Loam"], seasons: ["Kharif (Jun–Oct)", "Rabi (Nov–Mar)"], water: "Medium",
    duration: "95–115 days", yieldRange: "22–30 quintals per acre",
    guidance: "Use hybrid seed, apply nitrogen in three splits and irrigate at knee-high and tasselling stages.",
    demand: "Steady poultry feed demand across Telangana.",
    soilReq: "Well drained loamy soils",
  },
  {
    name: "Red Gram (Kandi)", nameTe: "కంది", category: "pulses",
    ph: [6.0, 7.8], n: 120, p: 22, k: 160,
    soils: ["Red Soil", "Black Soil", "Sandy Loam"], seasons: ["Kharif (Jun–Oct)"], water: "Low",
    duration: "160–180 days", yieldRange: "5–8 quintals per acre",
    guidance: "Ideal for rainfed land, fixes nitrogen and improves soil for the next crop.",
    demand: "Assured MSP procurement and good local dal mill demand.",
    soilReq: "Well drained soils, avoid waterlogging",
  },
  {
    name: "Paddy (Rice)", nameTe: "వరి", category: "grains",
    ph: [5.5, 7.5], n: 280, p: 24, k: 200,
    soils: ["Clay Loam", "Alluvial", "Black Soil"], seasons: ["Kharif (Jun–Oct)", "Rabi (Nov–Mar)"], water: "High",
    duration: "120–145 days", yieldRange: "25–35 quintals per acre",
    guidance: "Only choose paddy with assured water. Use alternate wetting and drying to save water.",
    demand: "Very high — Telangana is a leading paddy procurement state.",
    soilReq: "Clay soils that hold water",
  },
  {
    name: "Groundnut", nameTe: "వేరుశనగ", category: "oilseeds",
    ph: [6.0, 7.5], n: 150, p: 25, k: 150,
    soils: ["Sandy Loam", "Red Soil", "Laterite"], seasons: ["Rabi (Nov–Mar)", "Summer (Mar–Jun)"], water: "Medium",
    duration: "105–120 days", yieldRange: "8–12 quintals per acre",
    guidance: "Apply gypsum at pegging stage for better pod filling.",
    demand: "Good oil mill demand in Mahbubnagar and Nagarkurnool.",
    soilReq: "Light, loose sandy loam",
  },
  {
    name: "Chilli", nameTe: "మిరప", category: "spices",
    ph: [6.0, 7.5], n: 250, p: 30, k: 250,
    soils: ["Black Soil", "Red Soil", "Clay Loam"], seasons: ["Kharif (Jun–Oct)", "Rabi (Nov–Mar)"], water: "Medium",
    duration: "150–180 days", yieldRange: "18–25 quintals dry per acre",
    guidance: "High value but needs careful thrips and virus management. Use drip irrigation where possible.",
    demand: "Very strong — Khammam and Warangal chilli markets.",
    soilReq: "Well drained black or red soils",
  },
  {
    name: "Turmeric", nameTe: "పసుపు", category: "spices",
    ph: [5.5, 7.5], n: 260, p: 28, k: 260,
    soils: ["Red Soil", "Clay Loam", "Alluvial"], seasons: ["Kharif (Jun–Oct)"], water: "High",
    duration: "240–270 days", yieldRange: "22–30 quintals dry per acre",
    guidance: "Needs rich organic matter and shade in early stage. Long duration crop, plan cash flow.",
    demand: "Nizamabad turmeric market is one of India's largest.",
    soilReq: "Rich loamy soils high in organic carbon",
  },
  {
    name: "Tomato", nameTe: "టమాటా", category: "vegetables",
    ph: [6.0, 7.5], n: 240, p: 28, k: 240,
    soils: ["Red Soil", "Sandy Loam", "Clay Loam"], seasons: ["Kharif (Jun–Oct)", "Rabi (Nov–Mar)", "Summer (Mar–Jun)"], water: "Medium",
    duration: "90–120 days", yieldRange: "80–120 quintals per acre",
    guidance: "Stake the plants, mulch to save water and harvest every 2–3 days for direct selling.",
    demand: "Daily demand in Hyderabad and Rangareddy markets.",
    soilReq: "Well drained fertile soils",
  },
  {
    name: "Bengal Gram (Chana)", nameTe: "శనగ", category: "pulses",
    ph: [6.2, 8.2], n: 130, p: 22, k: 150,
    soils: ["Black Soil", "Clay Loam"], seasons: ["Rabi (Nov–Mar)"], water: "Low",
    duration: "95–110 days", yieldRange: "6–9 quintals per acre",
    guidance: "Excellent low water rabi crop after paddy or cotton.",
    demand: "Good dal mill and MSP demand.",
    soilReq: "Black cotton soils with residual moisture",
  },
  {
    name: "Onion", nameTe: "ఉల్లిపాయ", category: "vegetables",
    ph: [6.0, 7.5], n: 230, p: 26, k: 220,
    soils: ["Red Soil", "Sandy Loam", "Alluvial"], seasons: ["Rabi (Nov–Mar)", "Kharif (Jun–Oct)"], water: "Medium",
    duration: "110–130 days", yieldRange: "60–90 quintals per acre",
    guidance: "Cure bulbs properly after harvest so they store longer and fetch better prices.",
    demand: "High and often price-volatile — direct selling helps.",
    soilReq: "Loose, well drained soils",
  },
  {
    name: "Sesame (Til)", nameTe: "నువ్వులు", category: "oilseeds",
    ph: [5.5, 8.0], n: 130, p: 20, k: 140,
    soils: ["Sandy Loam", "Red Soil", "Laterite"], seasons: ["Summer (Mar–Jun)", "Kharif (Jun–Oct)"], water: "Low",
    duration: "80–95 days", yieldRange: "2.5–4 quintals per acre",
    guidance: "Very low water requirement, good option when water is scarce.",
    demand: "Steady oil and export demand.",
    soilReq: "Light sandy soils, must drain well",
  },
  {
    name: "Green Gram (Pesalu)", nameTe: "పెసలు", category: "pulses",
    ph: [6.0, 7.5], n: 110, p: 20, k: 140,
    soils: ["Red Soil", "Sandy Loam", "Alluvial"], seasons: ["Summer (Mar–Jun)", "Kharif (Jun–Oct)"], water: "Low",
    duration: "60–75 days", yieldRange: "3–5 quintals per acre",
    guidance: "Short duration catch crop that also restores soil nitrogen.",
    demand: "Good household and mill demand.",
    soilReq: "Well drained light soils",
  },
];

const WATER_RANK: Record<string, number> = {
  "Rainfed only": 0,
  "Low (bore well, limited)": 1,
  "Medium (bore well / tank)": 2,
  "High (canal / assured)": 3,
};
const CROP_WATER_RANK: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

export function recommendCrops(input: RecommendationInput, limit = 6): CropRecommendation[] {
  const districtCrops = getDistrictSeasonCrops(
    input.district,
    input.season,
    input.water,
  );
  if (districtCrops?.length === 0) return [];

  const ph = num(input.ph);
  const n = num(input.nitrogen);
  const p = num(input.phosphorus);
  const k = num(input.potassium);
  const oc = num(input.organic_carbon);

  const candidateProfiles = districtCrops
    ? CROP_PROFILES.filter((crop) => matchesDistrictCrop(crop.name, districtCrops))
    : CROP_PROFILES;

  const scored = candidateProfiles.map((crop) => {
    let score = 40;
    const reasons: string[] = [];
    const reasonsTe: string[] = [];
    if (districtCrops != null) {
      reasons.push(
        `Included in the supplied ${input.district} ${input.season} list for this water availability`,
      );
      reasonsTe.push(
        `మీరు అందించిన ${input.district} ${input.season} మరియు నీటి లభ్యత జాబితాలో ఉంది`,
      );
    }

    // pH fit — 20 points
    if (ph != null) {
      if (ph >= crop.ph[0] && ph <= crop.ph[1]) {
        score += 20;
        reasons.push(`Your soil pH ${ph} suits ${crop.name}`);
        reasonsTe.push(`మీ మట్టి pH ${ph} ${crop.nameTe}కు సరిపోతుంది`);
      } else {
        const gap = ph < crop.ph[0] ? crop.ph[0] - ph : ph - crop.ph[1];
        score += Math.max(0, 20 - gap * 14);
        reasons.push(`Soil pH ${ph} is a little outside the ideal ${crop.ph[0]}–${crop.ph[1]} range`);
        reasonsTe.push(`మట్టి pH ${ph} ఆదర్శ ${crop.ph[0]}–${crop.ph[1]} పరిధికి కొంచెం బయట ఉంది`);
      }
    }

    // Nutrients — 18 points
    let nutrientHits = 0;
    if (n != null && n >= crop.n * 0.8) nutrientHits++;
    if (p != null && p >= crop.p * 0.8) nutrientHits++;
    if (k != null && k >= crop.k * 0.8) nutrientHits++;
    score += nutrientHits * 6;
    if (nutrientHits >= 2) {
      reasons.push("Soil nutrient levels support this crop");
      reasonsTe.push("మట్టి పోషకాలు ఈ పంటకు అనుకూలం");
    } else {
      reasons.push("Some nutrients will need topping up before sowing");
      reasonsTe.push("విత్తే ముందు కొన్ని పోషకాలు వేయాల్సి ఉంటుంది");
    }

    // Soil type — 10
    const soilSuitability = input.soil_type ? crop.soils.includes(input.soil_type) : null;
    if (input.soil_type && crop.soils.includes(input.soil_type)) {
      score += 10;
      reasons.push(`${input.soil_type} is well suited to ${crop.name}`);
      reasonsTe.push(`${input.soil_type} ${crop.nameTe}కు అనుకూలం`);
    }

    // Season — 12
    if (input.season && !input.season.startsWith("Other")) {
      if (crop.seasons.includes(input.season)) {
        score += 12;
        reasons.push(`Right season — ${input.season}`);
        reasonsTe.push(`సరైన సీజన్ — ${input.season}`);
      } else {
        score -= 18;
      }
    }

    // Water — 14
    const waterSuitability = input.water
      ? (WATER_RANK[input.water] ?? 2) >= (CROP_WATER_RANK[crop.water] ?? 2)
      : null;
    if (input.water) {
      const have = WATER_RANK[input.water] ?? 2;
      const need = CROP_WATER_RANK[crop.water] ?? 2;
      if (have >= need) {
        score += 14;
        reasons.push(`Your water availability matches a ${crop.water.toLowerCase()} water crop`);
        reasonsTe.push(`మీ నీటి లభ్యత ఈ పంటకు సరిపోతుంది`);
      } else {
        score -= (need - have) * 14;
        reasons.push(`This crop needs more water than you have available`);
        reasonsTe.push(`ఈ పంటకు మీ దగ్గర ఉన్న దానికంటే ఎక్కువ నీరు అవసరం`);
      }
    }

    // Organic carbon bonus for heavy feeders
    if (oc != null && oc >= 0.6 && ["Turmeric", "Tomato", "Chilli"].includes(crop.name)) {
      score += 5;
      reasons.push("Good organic carbon supports this high value crop");
      reasonsTe.push("మంచి సేంద్రియ కర్బనం ఈ విలువైన పంటకు తోడ్పడుతుంది");
    }

    // Rotation: discourage repeating the same crop, reward legume rotation
    if (input.previous_crop) {
      if (input.previous_crop.toLowerCase() === crop.name.toLowerCase()) {
        score -= 12;
        reasons.push("You grew this last season — rotating crops protects soil health");
        reasonsTe.push("గత సీజన్‌లో ఇదే వేశారు — పంట మార్పిడి మట్టికి మంచిది");
      } else if (crop.category === "pulses") {
        score += 6;
        reasons.push("A pulse crop after your last crop will restore soil nitrogen");
        reasonsTe.push("పప్పు పంట మట్టిలో నత్రజనిని తిరిగి పెంచుతుంది");
      }
    }

    if (input.preference && input.preference !== "any" && crop.category === input.preference) {
      score += 8;
      reasons.push("Matches the crop type you prefer");
      reasonsTe.push("మీరు కోరుకున్న పంట రకంతో సరిపోతుంది");
    }

    const finalScore = Math.max(20, Math.min(98, Math.round(score)));

    return {
      crop_name: crop.name,
      crop_name_te: crop.nameTe,
      suitability_score: finalScore,
      district_season_listed: districtCrops != null && matchesDistrictCrop(crop.name, districtCrops),
      soil_suitability: soilSuitability,
      water_suitability: waterSuitability,
      reasons: reasons.slice(0, 4),
      reasons_te: reasonsTe.slice(0, 4),
      duration_days: crop.duration,
      water_requirement: crop.water,
      soil_requirement: crop.soilReq,
      yield_range: crop.yieldRange,
      guidance: crop.guidance,
      market_demand: crop.demand,
      category: crop.category,
    } satisfies CropRecommendation;
  });

  return scored.sort((a, b) => b.suitability_score - a.suitability_score).slice(0, limit);
}
