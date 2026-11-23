import districtCropJson from "@/data/telangana_33_districts_crops_v2.json?raw";
import { z } from "zod";

const WaterCropsSchema = z.object({
  water_available: z.array(z.string()),
  less_water_available: z.array(z.string()),
});

const DistrictCropsSchema = z.object({
  s_no: z.number(),
  district: z.string().min(1),
  kharif: WaterCropsSchema,
  rabi: WaterCropsSchema,
  any_other: WaterCropsSchema,
  any_other_annual_perennial: z.array(z.string()),
});

type DistrictCropRow = z.infer<typeof DistrictCropsSchema>;
type DistrictWaterGroup = "water_available" | "less_water_available";

const districtRows = z.array(DistrictCropsSchema).parse(
  JSON.parse(districtCropJson),
);
const DISTRICT_CROPS = new Map<string, DistrictCropRow>();

for (const row of districtRows) {
  const key = normalize(row.district);
  if (DISTRICT_CROPS.has(key)) {
    throw new Error(`Duplicate district in crop JSON: ${row.district}`);
  }
  DISTRICT_CROPS.set(key, row);
}

const DISTRICT_ALIASES: Record<string, string> = {
  jagitial: "jagtial",
  kumurambheem: "kumurambheemasifabad",
  mahbubnagar: "mahabubnagar",
};

const CROP_ALIAS_GROUPS = [
  ["paddy", "rice"],
  ["redgram", "kandi", "pigeonpea", "toor"],
  ["bengalgram", "chickpea", "chana"],
  ["greengram", "moong", "mungbean", "pesalu"],
  ["blackgram", "urad"],
  ["chilli", "chillies", "chili", "chilies"],
  ["jowar", "sorghum"],
  ["groundnut", "peanut"],
  ["sesame", "til"],
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function canonicalDistrict(district: string): string {
  const key = normalize(district);
  return DISTRICT_ALIASES[key] ?? key;
}

function canonicalCrop(crop: string): string {
  const key = normalize(crop.replace(/\([^)]*\)/g, ""));
  return (
    CROP_ALIAS_GROUPS.find((aliases) =>
      aliases.some((alias) => key.includes(alias)),
    )?.[0] ?? key
  );
}

export function getDistrictWaterGroup(
  water: string | null | undefined,
): DistrictWaterGroup | null {
  if (!water) return null;
  if (water === "Rainfed only" || water.startsWith("Low"))
    return "less_water_available";
  if (water.startsWith("Medium") || water.startsWith("High"))
    return "water_available";
  return null;
}

export function getDistrictSeasonCrops(
  district: string | null | undefined,
  season: string | null | undefined,
  water?: string | null,
): string[] | null {
  if (!district || !season) return null;

  const row = DISTRICT_CROPS.get(canonicalDistrict(district));
  if (!row) return null;

  const seasonalCrops = season.startsWith("Kharif")
    ? row.kharif
    : season.startsWith("Rabi")
      ? row.rabi
      : season.startsWith("Other")
        ? row.any_other
        : null;
  if (!seasonalCrops) return null;

  const waterGroup = getDistrictWaterGroup(water);
  if (!waterGroup) {
    return [
      ...seasonalCrops.water_available,
      ...seasonalCrops.less_water_available,
    ];
  }
  return seasonalCrops[waterGroup];
}

export function matchesDistrictCrop(
  cropName: string,
  districtCrops: string[],
): boolean {
  const name = canonicalCrop(cropName);
  return districtCrops.some((crop) => canonicalCrop(crop) === name);
}
