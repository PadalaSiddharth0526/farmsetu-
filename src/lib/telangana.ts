export const DISTRICTS = [
  "Adilabad",
  "Bhadradri Kothagudem",
  "Hanumakonda",
  "Hyderabad",
  "Jagtial",
  "Jangaon",
  "Jayashankar Bhupalpally",
  "Jogulamba Gadwal",
  "Kamareddy",
  "Karimnagar",
  "Khammam",
  "Kumuram Bheem Asifabad",
  "Mahabubabad",
  "Mahabubnagar",
  "Mancherial",
  "Medak",
  "Medchal-Malkajgiri",
  "Mulugu",
  "Nagarkurnool",
  "Nalgonda",
  "Narayanpet",
  "Nirmal",
  "Nizamabad",
  "Peddapalli",
  "Rajanna Sircilla",
  "Rangareddy",
  "Sangareddy",
  "Siddipet",
  "Suryapet",
  "Vikarabad",
  "Wanaparthy",
  "Warangal",
  "Yadadri Bhuvanagiri",
];

export const SOIL_TYPES = ["Red Soil", "Black Soil", "Sandy Loam", "Clay Loam", "Alluvial", "Laterite"];
export const SEASONS = ["Kharif (Jun–Oct)", "Rabi (Nov–Mar)", "Summer (Mar–Jun)", "Other (Annual / Perennial)"];
export const WATER_LEVELS = ["Rainfed only", "Low (bore well, limited)", "Medium (bore well / tank)", "High (canal / assured)"];

export const CATEGORIES = [
  { value: "vegetables", en: "Vegetables", te: "కూరగాయలు" },
  { value: "fruits", en: "Fruits", te: "పండ్లు" },
  { value: "grains", en: "Grains & Cereals", te: "ధాన్యాలు" },
  { value: "pulses", en: "Pulses", te: "పప్పు ధాన్యాలు" },
  { value: "spices", en: "Spices", te: "మసాలాలు" },
  { value: "commercial", en: "Commercial Crops", te: "వాణిజ్య పంటలు" },
  { value: "oilseeds", en: "Oilseeds", te: "నూనె గింజలు" },
];

export const UNITS = ["kg", "quintal", "ton"];
export const QUALITY_GRADES = ["A", "B", "C"];

export const ORDER_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<string, [string, string]> = {
  placed: ["Order Placed", "ఆర్డర్ పెట్టబడింది"],
  accepted: ["Farmer Accepted", "రైతు అంగీకరించారు"],
  preparing: ["Preparing", "సిద్ధం చేస్తున్నారు"],
  ready: ["Ready for Pickup", "పికప్‌కి సిద్ధం"],
  out_for_delivery: ["Out for Delivery", "డెలివరీకి బయలుదేరింది"],
  delivered: ["Delivered", "డెలివరీ అయ్యింది"],
  cancelled: ["Cancelled", "రద్దు చేయబడింది"],
};

export const CROP_IMAGES: { label: string; url: string }[] = [
  { label: "Tomatoes", url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80" },
  { label: "Rice / Paddy", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80" },
  { label: "Cotton", url: "https://images.unsplash.com/photo-1594892619764-3a4e5f52a2cf?w=800&q=80" },
  { label: "Pulses", url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80" },
  { label: "Chillies", url: "https://images.unsplash.com/photo-1583119912267-cc97c911e416?w=800&q=80" },
  { label: "Maize", url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80" },
  { label: "Turmeric", url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&q=80" },
  { label: "Brinjal", url: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=800&q=80" },
  { label: "Onions", url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&q=80" },
  { label: "Mangoes", url: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80" },
  { label: "Groundnut", url: "https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=800&q=80" },
  { label: "Leafy greens", url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80" },
];

export function rupees(value: number) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
