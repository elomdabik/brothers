import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone, Settings, ChevronDown, User, Tag, Shield, Search, ShoppingCart, LogIn, Facebook, Youtube, Music2 } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navLinks = [
  { to: "/", label: "الرئيسية" },
  { to: "/products", label: "المنتجات" },
  { to: "/brides", label: "تجهيز العرائس" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
];

type ModeTarget = "wholesale" | "admin";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<ModeTarget>("wholesale");
  const [pw, setPw] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isWholesale,
    isAdmin,
    unlockWholesale,
    unlockAdmin,
    lockWholesale,
    lockAdmin,
  } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("search") ?? "");
  }, [location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
    setIsOpen(false);
  };

  const currentMode: "retail" | "wholesale" | "admin" = isAdmin
    ? "admin"
    : isWholesale
    ? "wholesale"
    : "retail";

  const modeLabel =
    currentMode === "admin"
      ? "وضع الأدمن"
      : currentMode === "wholesale"
      ? "وضع الجملة"
      : "وضع القطاعي";

  const ModeIcon =
    currentMode === "admin" ? Shield : currentMode === "wholesale" ? Tag : User;

  const switchToRetail = () => {
    if (isAdmin) lockAdmin();
    if (isWholesale) lockWholesale();
    toast({ title: "تم التبديل إلى وضع القطاعي" });
  };

  const requestUnlock = (target: ModeTarget) => {
    setPwTarget(target);
    setPwOpen(true);
  };

  const handleSelectWholesale = () => {
    if (isWholesale && !isAdmin) return;
    if (isAdmin) lockAdmin();
    if (isWholesale) {
      toast({ title: "وضع الجملة مفعل" });
      return;
    }
    requestUnlock("wholesale");
  };

  const handleSelectAdmin = () => {
    if (isAdmin) {
      toast({ title: "وضع الأدمن مفعل" });
      return;
    }
    requestUnlock("admin");
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const ok =
      pwTarget === "admin" ? unlockAdmin(pw) : unlockWholesale(pw);
    if (ok) {
      toast({
        title:
          pwTarget === "admin"
            ? "✓ تم تفعيل وضع الأدمن"
            : "✓ تم تفعيل وضع الجملة",
      });
      setPwOpen(false);
      setPw("");
    } else {
      toast({ title: "كلمة سر خاطئة", variant: "destructive" });
    }
  };

  const ModeMenu = ({ onSelect }: { onSelect?: () => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            currentMode === "admin"
              ? "bg-primary text-primary-foreground"
              : currentMode === "wholesale"
              ? "bg-accent text-accent-foreground"
              : "border border-border text-foreground hover:bg-secondary"
          }`}
        >
          <ModeIcon className="w-4 h-4" />
          {modeLabel}
          <ChevronDown className="w-4 h-4 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => { switchToRetail(); onSelect?.(); }}
          className="gap-2"
        >
          <User className="w-4 h-4" />
          <div className="flex-1">
            <div className="font-semibold">وضع القطاعي</div>
            <div className="text-xs text-muted-foreground">أسعار البيع للعميل</div>
          </div>
          {currentMode === "retail" && <span className="text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => { handleSelectWholesale(); onSelect?.(); }}
          className="gap-2"
        >
          <Tag className="w-4 h-4" />
          <div className="flex-1">
            <div className="font-semibold">وضع الجملة</div>
            <div className="text-xs text-muted-foreground">أسعار الجملة + البيع</div>
          </div>
          {currentMode === "wholesale" && <span className="text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { handleSelectAdmin(); onSelect?.(); }}
          className="gap-2"
        >
          <Shield className="w-4 h-4" />
          <div className="flex-1">
            <div className="font-semibold">وضع الأدمن</div>
            <div className="text-xs text-muted-foreground">لوحة التحكم + كل الأسعار</div>
          </div>
          {currentMode === "admin" && <span className="text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const SocialLinks = () => (
    <div className="flex items-center gap-1" dir="ltr">
      <Button asChild variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary" title="فيسبوك">
        <a href="https://www.facebook.com/thebrothers4you/" target="_blank" rel="noopener noreferrer" aria-label="صفحة معرض الأخوة على فيسبوك">
          <Facebook />
        </a>
      </Button>
      <Button asChild variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary" title="تيك توك">
        <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" aria-label="تيك توك">
          <Music2 />
        </a>
      </Button>
      <Button asChild variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary" title="يوتيوب">
        <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="يوتيوب">
          <Youtube />
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
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/login"><LogIn /> <span className="hidden xl:inline">تسجيل الدخول</span></Link>
            </Button>
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
              <Button asChild variant="ghost" size="sm"><Link to="/login" onClick={() => setIsOpen(false)}><LogIn /> الدخول</Link></Button>
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
            {isAdmin && (
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
            <ModeMenu />
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
            {isAdmin && (
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
            <div className="px-1 py-2">
              <ModeMenu onSelect={() => setIsOpen(false)} />
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

      <Dialog open={pwOpen} onOpenChange={(o) => { setPwOpen(o); if (!o) setPw(""); }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pwTarget === "admin" ? "تفعيل وضع الأدمن" : "تفعيل وضع الجملة"}
            </DialogTitle>
            <DialogDescription>
              {pwTarget === "admin"
                ? "ادخل كلمة سر الأدمن للوصول إلى لوحة التحكم وكل الأسعار."
                : "ادخل كلمة السر للاطلاع على أسعار الجملة بجانب أسعار القطاعي."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUnlock} className="space-y-3">
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="كلمة السر"
              autoFocus
            />
            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-bold">
              فتح
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
