import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "te";

type Dict = Record<string, [string, string]>;

// [English, Telugu]
const DICT: Dict = {
  brand: ["FarmSetu", "ఫామ్‌సేతు"],
  home: ["Home", "హోమ్"],
  soilTest: ["Soil Test", "మట్టి పరీక్ష"],
  cropRec: ["Crop Recommendation", "పంట సిఫార్సు"],
  marketplace: ["Marketplace", "మార్కెట్"],
  howItWorks: ["How It Works", "ఎలా పనిచేస్తుంది"],
  about: ["About", "మా గురించి"],
  login: ["Login / Register", "లాగిన్ / నమోదు"],
  logout: ["Logout", "లాగ్ అవుట్"],
  iAmFarmer: ["I am a Farmer", "నేను రైతును"],
  iAmCustomer: ["I am a Customer", "నేను కొనుగోలుదారుని"],
  heroTitle: ["Smart Farming. Better Soil. Better Prices.", "స్మార్ట్ వ్యవసాయం. ఆరోగ్యకరమైన మట్టి. మంచి ధరలు."],
  heroSub: [
    "Test your soil and sell directly to customers.",
    "మీ మట్టిని పరీక్షించి నేరుగా కొనుగోలుదారులకు అమ్మండి.",
  ],
  testMySoil: ["Test My Soil", "మట్టి పరీక్ష చేయండి"],
  sellMyCrop: ["Sell My Crop", "పంట అమ్మండి"],
  buyFresh: ["Buy Fresh Crops", "పంట కొనండి"],
  orders: ["Orders", "ఆర్డర్లు"],
  dashboard: ["Dashboard", "డాష్‌బోర్డ్"],
  profile: ["Profile", "ప్రొఫైల్"],
  cart: ["Cart", "బండి"],
  soil: ["Soil", "మట్టి"],
  price: ["Price", "ధర"],
  quantity: ["Quantity", "పరిమాణం"],
  farmer: ["Farmer", "రైతు"],
  customer: ["Customer", "కొనుగోలుదారు"],
  admin: ["Admin", "అడ్మిన్"],
  addToCart: ["Add to Cart", "బండిలో చేర్చండి"],
  buyNow: ["Buy Now", "ఇప్పుడే కొనండి"],
  orderNow: ["Order Now", "ఆర్డర్ చేయండి"],
  viewProduct: ["View Product", "వివరాలు చూడండి"],
  placeOrder: ["Place Order", "ఆర్డర్ పెట్టండి"],
  analyzeSoil: ["Analyze My Soil", "నా మట్టిని విశ్లేషించండి"],
  soilHealthReport: ["Soil Health Report", "మట్టి ఆరోగ్య నివేదిక"],
  good: ["Good", "మంచిది"],
  medium: ["Medium", "మధ్యస్థం"],
  low: ["Low", "తక్కువ"],
  district: ["District", "జిల్లా"],
  village: ["Village", "గ్రామం"],
  mandal: ["Mandal", "మండలం"],
  season: ["Season", "సీజన్"],
  water: ["Water availability", "నీటి లభ్యత"],
  farmSize: ["Farm size (acres)", "పొలం విస్తీర్ణం (ఎకరాలు)"],
  soilType: ["Soil type", "మట్టి రకం"],
  prevCrop: ["Previous crop", "గత పంట"],
  fullName: ["Full Name", "పూర్తి పేరు"],
  mobile: ["Mobile Number", "మొబైల్ నంబర్"],
  email: ["Email", "ఇమెయిల్"],
  password: ["Password", "పాస్‌వర్డ్"],
  pincode: ["Pincode", "పిన్‌కోడ్"],
  register: ["Register", "నమోదు"],
  signIn: ["Sign In", "లాగిన్"],
  language: ["Language", "భాష"],
  notifications: ["Notifications", "నోటిఫికేషన్లు"],
  addProduct: ["Add Product", "ఉత్పత్తి చేర్చండి"],
  manageOrders: ["Manage Orders", "ఆర్డర్లు నిర్వహించండి"],
  earnings: ["View Earnings", "ఆదాయం చూడండి"],
  uploadSoil: ["Upload Soil Test", "మట్టి నివేదిక అప్‌లోడ్"],
  totalFarmArea: ["Total Farm Area", "మొత్తం పొలం"],
  soilTests: ["Soil Tests", "మట్టి పరీక్షలు"],
  activeListings: ["Active Listings", "అమ్మకంలో ఉన్నవి"],
  pendingOrders: ["Pending Orders", "పెండింగ్ ఆర్డర్లు"],
  totalSales: ["Total Sales", "మొత్తం అమ్మకాలు"],
  quickActions: ["Quick Actions", "త్వరిత చర్యలు"],
  search: ["Search for tomatoes, rice, cotton, vegetables…", "టమాటా, బియ్యం, పత్తి, కూరగాయలు వెతకండి…"],
  organic: ["Organic", "సేంద్రియ"],
  disclaimer: [
    "These are recommendations only, not guaranteed agricultural advice. Please confirm with your local agriculture officer before applying fertilizers.",
    "ఇవి సిఫార్సులు మాత్రమే, ఖచ్చితమైన వ్యవసాయ సలహా కాదు. ఎరువులు వేసే ముందు మీ స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.",
  ],
};

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof DICT | string) => string;
  pick: (en: string, te?: string | null) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("tf-lang");
    if (stored === "te" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("tf-lang", l);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const idx = lang === "te" ? 1 : 0;
    return {
      lang,
      setLang,
      t: (key) => DICT[key as string]?.[idx] ?? (key as string),
      pick: (en, te) => (lang === "te" && te ? te : en),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
