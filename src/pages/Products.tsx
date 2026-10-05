import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Filter, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProductWhatsAppUrl } from "@/lib/whatsapp";
import { getProducts } from "@/services/db/products";
import Layout from "@/components/Layout";
import type { Product } from "@/components/ProductDetailDialog";
import { useCurrentPriceView } from "@/hooks/usePriceView";
import { useRequireLogin } from "@/hooks/useRequireLogin";

const Products = () => {
  const [selectedCat, setSelectedCat] = useState("الكل");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showWholesalePrices } = useCurrentPriceView();
  const requireLogin = useRequireLogin();

  const { data: productsData = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts({}),
  });
  const products = productsData as Product[];

  const categories = useMemo(() => {
    return ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  const searchQuery = (searchParams.get("search") ?? "").trim().toLocaleLowerCase("ar");
  const filtered = products.filter((p) => {
    const matchesCategory = selectedCat === "الكل" || p.category === selectedCat;
    const matchesSearch = !searchQuery || [p.name, p.internal_code, p.international_code, p.category]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("ar").includes(searchQuery));
    return matchesCategory && matchesSearch;
  });


  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-cairo font-extrabold text-center mb-4">
            <span className="text-gradient-gold">منتجاتنا</span>
          </h1>
          <p className="text-center text-muted-foreground mb-10">اختار اللي يناسبك واطلب مباشرة عبر واتساب</p>
          {searchQuery && (
            <p className="text-center font-semibold mb-6">نتائج البحث عن: <span className="text-primary">{searchParams.get("search")}</span></p>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <Filter className="w-5 h-5 text-muted-foreground mt-2" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCat === cat
                    ? "gradient-gold text-primary-foreground shadow-gold"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="bg-card rounded-2xl overflow-hidden shadow-warm border border-border hover:-translate-y-1 transition-transform cursor-pointer"
              >
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
                  <ul className="space-y-1 mb-3">
                    {p.benefits.map((b) => (
                      <li key={b} className="text-muted-foreground text-xs flex items-center gap-1">
                        <span className="text-primary">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                  {p.sizes && <p className="text-xs text-muted-foreground mb-3">📐 {p.sizes}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {showWholesalePrices ? (p.wholesale_price || p.price) : p.price}
                    </span>
                    {showWholesalePrices && <span className="text-xs text-muted-foreground">جملة</span>}
                  </div>
                  <a
                    href={getProductWhatsAppUrl(p.name)}
                    onClick={(e) => { e.stopPropagation(); requireLogin(e); }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full gradient-gold text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-gold hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle className="w-4 h-4" />
                    اطلب عبر واتساب
                  </a>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">لا توجد منتجات مطابقة للبحث.</div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Products;
