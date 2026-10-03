import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone, Settings, User, Tag, Shield, Search, ShoppingCart, LogIn, Facebook, Youtube, LogOut } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Login from "@/pages/Login";

const navLinks = [
  { to: "/", label: "الرئيسية" },
  { to: "/products", label: "المنتجات" },
  { to: "/brides", label: "تجهيز العرائس" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isWholesale,
    isSupervisor,
    isAdmin,
    authError,
  } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("search") ?? "");
  }, [location.search]);

  useEffect(() => {
    const openLogin = () => {
      setIsOpen(false);
      setLoginOpen(true);
    };
    window.addEventListener("brothers:open-login", openLogin);
    return () => window.removeEventListener("brothers:open-login", openLogin);
  }, []);

  useEffect(() => {
    if (authError) {
      toast({ title: "تعذّر تحميل صلاحيات الحساب", description: authError, variant: "destructive" });
    }
  }, [authError, toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
    setIsOpen(false);
  };

  const currentMode: "retail" | "wholesale" | "supervisor" | "admin" = isAdmin
    ? "admin"
    : isSupervisor
    ? "supervisor"
    : isWholesale
    ? "wholesale"
    : "retail";

  const modeLabel =
    currentMode === "admin"
      ? "وضع الأدمن"
      : currentMode === "supervisor"
      ? "المشرف العام"
      : currentMode === "wholesale"
      ? "وضع الجملة"
      : "وضع القطاعي";

  const ModeIcon =
    currentMode === "admin" || currentMode === "supervisor"
      ? Shield
      : currentMode === "wholesale"
      ? Tag
      : User;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "تعذّر تسجيل الخروج", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "تم تسجيل الخروج" });
  };

  const SocialLinks = () => (
    <div className="flex items-center gap-1" dir="ltr">
      <Button asChild variant="ghost" size="icon" className="rounded-full bg-[#1877f2]/10 text-[#1877f2] transition-colors hover:bg-[#1877f2] hover:text-white" title="فيسبوك">
        <a href="https://www.facebook.com/thebrothers4you/" target="_blank" rel="noopener noreferrer" aria-label="صفحة معرض الأخوة على فيسبوك">
          <Facebook className="h-5 w-5" />
        </a>
      </Button>
      <Button asChild variant="ghost" size="icon" className="rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-foreground hover:text-background" title="تيك توك">
        <a href="https://bit.ly/brothers4you" target="_blank" rel="noopener noreferrer" aria-label="تيك توك">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.89-2.9 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.05.87.14v-3.52a6.42 6.42 0 0 0-.87-.06 6.34 6.34 0 1 0 6.33 6.34V8.74a8.18 8.18 0 0 0 4.79 1.54V6.83c-.35 0-.69-.05-1.02-.14Z" />
          </svg>
        </a>
      </Button>
      <Button asChild variant="ghost" size="icon" className="rounded-full bg-[#ff0000]/10 text-[#ff0000] transition-colors hover:bg-[#ff0000] hover:text-white" title="يوتيوب">
        <a href="https://www.youtube.com/@brothers4you" target="_blank" rel="noopener noreferrer" aria-label="قناة معرض الأخوة على يوتيوب">
          <Youtube className="h-5 w-5" />
        </a>
      </Button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-warm">
      <div className="border-b border-border bg-background/80">
        <div className="container mx-auto px-4 min-h-20 py-3 flex items-center gap-3 lg:gap-6">
          <Link to="/" className="shrink-0 flex flex-col leading-none" aria-label="معرض الأخوة - الرئيسية">
            <span className="text-2xl md:text-3xl font-cairo font-extrabold text-gradient-gold">الأخوة</span>
            <span className="hidden sm:block text-[10px] text-muted-foreground mt-1">لتجهيزات العرائس</span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج أو كود..."
              className="h-11 rounded-full bg-card pe-12 ps-4"
              aria-label="البحث عن المنتجات"
            />
            <Button type="submit" size="icon" className="absolute top-1/2 -translate-y-1/2 left-1 rounded-full h-9 w-9" aria-label="بحث">
              <Search />
            </Button>
          </form>

          <div className="hidden md:flex items-center gap-1">
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/cart"><ShoppingCart /> <span className="hidden xl:inline">السلة</span></Link>
            </Button>
            {isAuthenticated ? (
              <Button type="button" variant="ghost" className="gap-2" onClick={() => void handleSignOut()}>
                <LogOut /> <span className="hidden xl:inline">خروج</span>
              </Button>
            ) : (
              <Button type="button" variant="ghost" className="gap-2" onClick={() => setLoginOpen(true)}>
                <LogIn /> <span className="hidden xl:inline">تسجيل الدخول</span>
              </Button>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
              <ModeIcon className="h-4 w-4" />
              <span className="hidden xl:inline">{modeLabel}</span>
            </div>
            <SocialLinks />
          </div>

          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="md:hidden shrink-0" aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}>
            {isOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {isOpen && (
          <div className="md:hidden container mx-auto px-4 pb-3 flex items-center justify-between border-t border-border pt-2">
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm"><Link to="/cart" onClick={() => setIsOpen(false)}><ShoppingCart /> السلة</Link></Button>
              {isAuthenticated ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setIsOpen(false); void handleSignOut(); }}><LogOut /> خروج</Button>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setIsOpen(false); setLoginOpen(true); }}><LogIn /> الدخول</Button>
              )}
            </div>
            <SocialLinks />
          </div>
        )}
      </div>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {(isAdmin || isSupervisor) && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  location.pathname === "/admin"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <Settings className="w-4 h-4" />
                لوحة التحكم
              </Link>
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
              <ModeIcon className="h-4 w-4" />
              {modeLabel}
            </div>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-gold text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-gold hover:opacity-90 transition-opacity"
            >
              <Phone className="w-4 h-4" />
              واتساب
            </a>
          </div>

          <div className="lg:hidden font-bold text-sm text-muted-foreground">القائمة الرئيسية</div>
        </div>

        {isOpen && (
          <nav className="lg:hidden pb-4 space-y-1 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {(isAdmin || isSupervisor) && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === "/admin"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <Settings className="w-4 h-4" />
                لوحة التحكم
              </Link>
            )}
            <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-muted-foreground">
              <ModeIcon className="h-4 w-4" />
              {modeLabel}
            </div>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="block gradient-gold text-primary-foreground px-4 py-3 rounded-lg font-semibold text-sm text-center shadow-gold"
            >
              تواصل عبر واتساب
            </a>
          </nav>
        )}
      </div>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent dir="rtl" className="max-w-sm max-h-[90vh] overflow-y-auto">
          <Login embedded onSuccess={() => setLoginOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
