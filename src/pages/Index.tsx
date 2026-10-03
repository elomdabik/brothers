import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Star, Truck, Shield, Heart, Users, ShoppingBag, ChefHat, Zap, Gift, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getWhatsAppUrl, getProductWhatsAppUrl } from "@/lib/whatsapp";
import { getProducts } from "@/services/db/products";
import heroBanner from "@/assets/hero-banner.jpg";
import Layout from "@/components/Layout";
import OffersSection from "@/components/OffersSection";
import type { Product } from "@/components/ProductDetailDialog";
import { useNavigate } from "react-router-dom";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { useAuth } from "@/hooks/useAuth";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 120, damping: 14 } },
};

const features = [
  { icon: ShoppingBag, title: "أسعار تنافسية", desc: "أسعار مناسبة تناسب الجميع" },
  { icon: Shield, title: "ضمان الجودة", desc: "منتجات أصلية بضمان حقيقي" },
  { icon: Truck, title: "توصيل سريع", desc: "نوصّل لحد باب بيتك" },
  { icon: Heart, title: "خبرة في تجهيز العرائس", desc: "باقات كاملة لكل الميزانيات" },
];

const categories = [
  { icon: ChefHat, title: "أطقم حلل جرانيت", link: "/products" },
  { icon: Star, title: "أطقم صيني وأركوبال", link: "/products" },
  { icon: Zap, title: "أجهزة كهربائية صغيرة", link: "/products" },
  { icon: ShoppingBag, title: "أدوات مطبخ", link: "/products" },
  { icon: Gift, title: "أطقم عرائس كاملة", link: "/brides" },
];

const testimonials = [
  { name: "أم محمد", text: "جهزت بنتي من المعرض والحمد لله كل حاجة ممتازة وأسعار معقولة جداً" },
  { name: "سارة أحمد", text: "أحسن معرض في بنها، المعاملة حلوة والبضاعة جودتها عالية" },
  { name: "حسن إبراهيم", text: "تعامل ممتاز وأسعار مافيش زيها، أمانة في كل حاجة" },
];

const ProductsCarousel = ({ products, onProductClick }: { products: Product[]; onProductClick: (p: Product) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const requireLogin = useRequireLogin();
  const { canSeeWholesale } = useAuth();

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || products.length === 0) return;
    const interval = setInterval(() => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 5) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [products]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button onClick={() => scroll("left")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 backdrop-blur-sm shadow-warm border border-border rounded-full w-10 h-10 flex items-center justify-center hover:bg-card transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll("right")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 backdrop-blur-sm shadow-warm border border-border rounded-full w-10 h-10 flex items-center justify-center hover:bg-card transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div ref={scrollRef} onScroll={updateScrollState} className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {products.map((p) => (
          <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-card rounded-2xl overflow-hidden shadow-warm border border-border hover:-translate-y-1 transition-transform min-w-[280px] max-w-[280px] flex-shrink-0">
            <div className="block cursor-pointer" onClick={() => onProductClick(p)}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-48 object-cover" loading="lazy" />
              ) : (
                <div className="h-48 gradient-warm flex items-center justify-center">
                  <span className="text-5xl">🏠</span>
                </div>
              )}
              <div className="p-5">
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{p.category}</span>
                <h3 className="font-bold text-lg mt-3 mb-2">{p.name}</h3>
                {p.benefits && (
                  <ul className="space-y-1 mb-3">
                    {p.benefits.map((b) => (
                      <li key={b} className="text-muted-foreground text-xs flex items-center gap-1">
                        <span className="text-primary">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    {canSeeWholesale ? (p.wholesale_price || p.price) : p.price}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <a
                href={getProductWhatsAppUrl(p.name)}
                onClick={(e) => { e.stopPropagation(); requireLogin(e); }}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full gradient-gold text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-gold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                اطلب عبر واتساب
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { data: products = [] } = useQuery({
    queryKey: ["products", { limit: 8 }],
    queryFn: () => getProducts({ limit: 8 }),
  });

  return (
    <Layout>
    {/* Hero */}
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBanner} alt="أجهزة منزلية وأدوات مطبخ" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-foreground/90 via-foreground/70 to-foreground/40" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-cairo font-extrabold text-background leading-tight mb-6">
            بيتك يستاهل
            <span className="block text-gold-light">الأفضل دايماً</span>
          </h1>
          <p className="text-lg md:text-xl text-background/80 mb-8 font-tajawal leading-relaxed">
            معرض الأخوة — وجهتك الأولى للأجهزة المنزلية وتجهيزات العرائس بأفضل الأسعار وأعلى جودة في بنها والقليوبية
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/products"
              className="gradient-gold text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg shadow-gold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              تصفح المنتجات
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-background/10 backdrop-blur-sm text-background border border-background/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-background/20 transition-colors"
            >
              تواصل عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </section>

    {/* Why Choose Us */}
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.h2 initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-cairo font-bold text-center mb-12">
          ليه تختار <span className="text-gradient-gold">معرض الأخوة؟</span>
        </motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -6, boxShadow: "0 16px 40px -8px hsl(38 75% 50% / 0.2)" }} className="bg-card rounded-2xl p-8 text-center shadow-warm transition-transform">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-gold flex items-center justify-center">
                <f.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Offers */}
    <OffersSection />

    {/* Categories */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.h2 initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-cairo font-bold text-center mb-12">
          تصفح <span className="text-gradient-gold">الأقسام</span>
        </motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((c) => (
            <motion.div key={c.title} variants={scaleIn}>
              <Link
                to={c.link}
                className="block bg-card rounded-2xl p-6 text-center shadow-warm hover:shadow-gold hover:-translate-y-1 transition-all group border border-border"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center group-hover:gradient-gold transition-colors">
                  <c.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-sm">{c.title}</h3>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

      {/* Products Auto-Scroll */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.h2 initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-cairo font-bold text-center mb-12">
            أحدث <span className="text-gradient-gold">المنتجات</span>
          </motion.h2>
          <ProductsCarousel products={products as Product[]} onProductClick={(p) => navigate(`/products/${p.id}`)} />
          <div className="text-center mt-10">
            <Link to="/products" className="gradient-gold text-primary-foreground px-8 py-3 rounded-xl font-bold text-lg shadow-gold hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              عرض كل المنتجات
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2 initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-cairo font-bold text-center mb-12">
            آراء <span className="text-gradient-gold">عملائنا</span>
          </motion.h2>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp} whileHover={{ y: -6, boxShadow: "0 16px 40px -8px hsl(38 75% 50% / 0.15)" }} className="bg-card rounded-2xl p-6 shadow-warm border border-border">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">"{t.text}"</p>
                <p className="font-bold text-sm">{t.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-gold overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: "easeOut" }} className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-cairo font-extrabold text-primary-foreground mb-4">
            جاهز تبدأ تجهز بيتك؟
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            تواصل معانا دلوقتي عبر واتساب واحصل على أفضل العروض والأسعار
          </p>
          <motion.a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-foreground text-background px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            تواصل عبر واتساب
            <ArrowLeft className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </section>
      
    </Layout>
  );
};

export default Index;
