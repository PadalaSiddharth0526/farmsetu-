import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Leaf, Menu, ShoppingCart, User, FlaskConical, Sprout, Home, Store, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useIsAdmin, useProfile, useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "home" },
  { to: "/marketplace", key: "marketplace" },
  { to: "/groups", key: "groups" },
  { to: "/crop-recommendation", key: "cropRec" },
  { to: "/soil-test", key: "soilTest" },
  { to: "/dashboards", key: "dashboards" },
  { to: "/overview", key: "overview" },
  { to: "/how-it-works", key: "howItWorks" },
  { to: "/about", key: "about" },
] as const;

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { count } = useCart();
  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isFarmer = profile?.role === "farmer";
  const dashboardTo = isAdmin ? "/admin" : isFarmer ? "/farmer/dashboard" : "/account";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg leading-tight font-bold">FarmSetu</span>
            <span className="block max-w-[160px] truncate text-[10px] leading-tight text-muted-foreground">Bridging Farms and Communities.</span>
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-0.5 lg:flex lg:flex-nowrap">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-full px-2 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground xl:px-3 xl:text-sm"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.key === "overview" ? "Overview" : item.key === "dashboards" ? "Dashboards" : item.key === "groups" ? (lang === "te" ? "గ్రూప్ కొనుగోలు" : "Group Buying") : t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <div className="hidden items-center rounded-full border border-border p-0.5 sm:flex">
            <button
              onClick={() => setLang("en")}
              className={cn("rounded-full px-3 py-1 text-xs font-semibold", lang === "en" && "bg-primary text-primary-foreground")}
            >
              English
            </button>
            <button
              onClick={() => setLang("te")}
              className={cn("rounded-full px-3 py-1 text-xs font-semibold", lang === "te" && "bg-primary text-primary-foreground")}
            >
              తెలుగు
            </button>
          </div>

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/cart" aria-label={t("cart")}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          {session ? (
            <div className="hidden items-center gap-1 lg:flex">
              <Button asChild variant="secondary">
                <Link to={dashboardTo}>
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  {t("dashboard")}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("logout")}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button asChild className="hidden lg:inline-flex">
              <Link to="/auth">{t("login")}</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto p-6">
              <div className="mt-6 flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-semibold hover:bg-secondary"
                  >
                    {item.key === "overview" ? "Overview" : item.key === "dashboards" ? "Dashboards" : item.key === "groups" ? (lang === "te" ? "గ్రూప్ కొనుగోలు" : "Group Buying") : t(item.key)}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
                <div className="flex gap-2">
                  <Button variant={lang === "en" ? "default" : "outline"} className="flex-1" onClick={() => setLang("en")}>
                    English
                  </Button>
                  <Button variant={lang === "te" ? "default" : "outline"} className="flex-1" onClick={() => setLang("te")}>
                    తెలుగు
                  </Button>
                </div>
                <div className="my-3 h-px bg-border" />
                {session ? (
                  <>
                    <Button asChild size="lg" onClick={() => setOpen(false)}>
                      <Link to={dashboardTo}>{t("dashboard")}</Link>
                    </Button>
                    <Button variant="outline" size="lg" className="mt-2" onClick={signOut}>
                      {t("logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" onClick={() => setOpen(false)}>
                      <Link to="/auth" search={{ role: "farmer" }}>
                        {t("iAmFarmer")}
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="mt-2" onClick={() => setOpen(false)}>
                      <Link to="/auth" search={{ role: "customer" }}>
                        {t("iAmCustomer")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const { t } = useI18n();
  const { data: profile } = useProfile();
  const { data: session } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profileTo = !session ? "/auth" : profile?.role === "farmer" ? "/farmer/dashboard" : "/account";

  const items = [
    { to: "/", label: t("home"), Icon: Home },
    { to: "/soil-test", label: t("soil"), Icon: FlaskConical },
    { to: "/crop-recommendation", label: t("cropRec"), Icon: Sprout },
    { to: "/marketplace", label: t("marketplace"), Icon: Store },
    { to: profileTo, label: t("profile"), Icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/98 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={label}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate px-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold">FarmSetu</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Helping Telangana farmers test their soil and sell directly to customers.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold">For Farmers</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/soil-test" className="hover:text-foreground">{t("soilTest")}</Link></li>
            <li><Link to="/crop-recommendation" className="hover:text-foreground">{t("cropRec")}</Link></li>
            <li><Link to="/farmer/sell" className="hover:text-foreground">{t("sellMyCrop")}</Link></li>
            <li><Link to="/farmer/orders" className="hover:text-foreground">{t("manageOrders")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">For Customers</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/marketplace" className="hover:text-foreground">{t("buyFresh")}</Link></li>
            <li><Link to="/cart" className="hover:text-foreground">{t("cart")}</Link></li>
            <li><Link to="/account" className="hover:text-foreground">{t("orders")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/how-it-works" className="hover:text-foreground">{t("howItWorks")}</Link></li>
            <li><Link to="/about" className="hover:text-foreground">{t("about")}</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">{t("login")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Telangana Farmers. Crop and fertilizer suggestions are guidance only — please confirm with your
        local agriculture officer.
      </div>
    </footer>
  );
}
