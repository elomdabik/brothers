import { Link } from "react-router-dom";
import { MapPin, Phone, Clock } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-background">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h3 className="text-xl font-bold font-cairo mb-4 text-gold-light">معرض الأخوة</h3>
          <p className="text-background/70 text-sm leading-relaxed">
            معرض الأخوة لتجهيزات العرائس — وجهتك الأولى للأجهزة المنزلية وأدوات المطبخ بأفضل الأسعار في بنها والقليوبية.
          </p>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-gold-light">روابط سريعة</h4>
          <nav className="space-y-2 text-sm">
            {[
              { to: "/products", label: "المنتجات" },
              { to: "/brides", label: "تجهيز العرائس" },
              { to: "/about", label: "من نحن" },
              { to: "/contact", label: "تواصل معنا" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="block text-background/70 hover:text-gold-light transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-gold-light">تواصل معنا</h4>
          <div className="space-y-3 text-sm text-background/70">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 shrink-0 text-gold-light" />
              <span>منية السباع - بنها - قليوبية<br />بجوار اتيلية ماسة وحلواني زمزم</span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 shrink-0 text-gold-light" />
              <span>شبلنجة - بنها - قليوبية<br />بجوار موقف الصنافين وعيادة د/أيمن حمدي عاقول</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-gold-light" />
              <a href="tel:01126244664" className="hover:text-gold-light transition-colors">01126244664</a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10 mt-10 pt-6 text-center text-xs text-background/50">
        © {new Date().getFullYear()} معرض الأخوة لتجهيزات العرائس. جميع الحقوق محفوظة.
      </div>
    </div>
  </footer>
);

export default Footer;
