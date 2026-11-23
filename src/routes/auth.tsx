import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Leaf, Sprout, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { DISTRICTS } from "@/lib/telangana";
import { cn } from "@/lib/utils";
import { lovable } from "@/integrations/lovable/index";

type Search = { role?: "farmer" | "customer" | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    role: search['role'] === "customer" ? "customer" : search['role'] === "farmer" ? "farmer" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Login or Register — Telangana Farmers" },
      { name: "description", content: "Create a free farmer or customer account to test soil, get crop advice and trade directly." },
      { property: "og:title", content: "Login or Register — Telangana Farmers" },
      { property: "og:description", content: "Create a free farmer or customer account on Telangana Farmers." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, pick } = useI18n();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: session } = useSession();

  const [role, setRole] = useState<"farmer" | "customer">(search.role ?? "farmer");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("Siddipet");
  const [village, setVillage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (session) navigate({ to: role === "farmer" ? "/farmer/dashboard" : "/account", replace: true });
  }, [session, navigate, role]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name, phone, role, district, village },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(pick("Account created. You can sign in now.", "ఖాతా సృష్టించబడింది. ఇప్పుడు లాగిన్ అవ్వండి."));
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(pick("Welcome back!", "మళ్ళీ స్వాగతం!"));
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <div className="hidden lg:block">
        <span className="grid h-14 w-14 place-items-center rounded-3xl bg-primary text-primary-foreground">
          <Leaf className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-4xl font-extrabold">{t("brand")}</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          {pick(
            "One free account gives you soil testing, crop recommendations, and a direct marketplace for your harvest.",
            "ఒక ఉచిత ఖాతాతో మట్టి పరీక్ష, పంట సిఫార్సులు, మీ పంటకు నేరుగా మార్కెట్ లభిస్తుంది.",
          )}
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li className="surface-panel rounded-2xl p-4">🧪 {pick("Instant soil health score", "వెంటనే మట్టి ఆరోగ్య స్కోరు")}</li>
          <li className="surface-panel rounded-2xl p-4">🌱 {pick("Crops matched to your district", "మీ జిల్లాకు సరిపోయే పంటలు")}</li>
          <li className="surface-panel rounded-2xl p-4">💰 {pick("Sell with zero commission", "కమిషన్ లేకుండా అమ్మకం")}</li>
        </ul>
      </div>

      <div className="surface-panel rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-3">
          {(["farmer", "customer"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-2xl border-2 p-4 text-left transition-colors",
                role === r ? "border-primary bg-secondary" : "border-border hover:border-primary/40",
              )}
            >
              {r === "farmer" ? <Sprout className="h-6 w-6 text-primary" /> : <ShoppingBasket className="h-6 w-6 text-primary" />}
              <span className="mt-2 block font-display font-bold">{r === "farmer" ? t("iAmFarmer") : t("iAmCustomer")}</span>
            </button>
          ))}
        </div>

        <Tabs defaultValue="login" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t("signIn")}</TabsTrigger>
            <TabsTrigger value="register">{t("register")}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form className="mt-5 space-y-4" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="login-email">{t("email")}</Label>
                <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-12" />
              </div>
              <div>
                <Label htmlFor="login-password">{t("password")}</Label>
                <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-12" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {t("signIn")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form className="mt-5 space-y-4" onSubmit={handleRegister}>
              <div>
                <Label htmlFor="reg-name">{t("fullName")}</Label>
                <Input id="reg-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-12" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="reg-phone">{t("mobile")}</Label>
                  <Input id="reg-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-12" />
                </div>
                <div>
                  <Label htmlFor="reg-village">{t("village")}</Label>
                  <Input id="reg-village" value={village} onChange={(e) => setVillage(e.target.value)} className="mt-1.5 h-12" />
                </div>
              </div>
              <div>
                <Label>{t("district")}</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger className="mt-1.5 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reg-email">{t("email")}</Label>
                <Input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-12" />
              </div>
              <div>
                <Label htmlFor="reg-password">{t("password")}</Label>
                <Input id="reg-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-12" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {t("register")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> {pick("or", "లేదా")} <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" size="lg" className="w-full" onClick={google}>
          {pick("Continue with Google", "గూగుల్‌తో కొనసాగండి")}
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {pick("Just browsing?", "చూడటానికే వచ్చారా?")}{" "}
          <Link to="/marketplace" className="font-semibold text-primary">
            {t("buyFresh")}
          </Link>
        </p>
      </div>
    </div>
  );
}
