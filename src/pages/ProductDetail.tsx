import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, MessageCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProductById, getSimilarProducts } from "@/services/db/products";
import { getProductWhatsAppUrl } from "@/lib/whatsapp";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  benefits: string[];
  sizes: string | null;
  image_url: string | null;
  additional_images?: string[] | null;
  wholesale_price?: string | null;
  purchase_price?: string | null;
  internal_code?: string | null;
  international_code?: string | null;
  specifications?: string | null;
};

const getAllImages = (p: Product) => {
  const images: string[] = [];
  if (p.image_url) images.push(p.image_url);
  if (p.additional_images) images.push(...p.additional_images.filter(Boolean));
  return images;
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isWholesale, isAdmin } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const {
    data: product = null,
    isLoading: loadingProduct,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  }) as { data: Product | null; isLoading: boolean };

  const { data: similar = [] } = useQuery({
    queryKey: ["similar", product?.category, product?.id],
    queryFn: () => getSimilarProducts(product!.category, product!.id, 8),
    enabled: !!product,
  }) as { data: Product[] };

  useEffect(() => {
    setCurrentImageIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const loading = loadingProduct;

  if (loading) {
    return (
      <Layout>
        <section className="py-20 text-center text-muted-foreground">جاري التحميل...</section>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <section className="py-20 text-center">
          <p className="text-muted-foreground mb-4">المنتج غير موجود</p>
          <Link to="/products" className="text-primary underline">العودة للمنتجات</Link>
        </section>
      </Layout>
    );
  }

  const images = getAllImages(product);

  return (
    <Layout>
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowRight className="w-4 h-4 ml-1" />
            رجوع
          </Button>

          <div className="grid md:grid-cols-2 gap-8 bg-card rounded-2xl p-6 border border-border shadow-warm">
            {/* Images */}
            <div>
              {images.length > 0 ? (
                <div className="relative">
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-80 sm:h-[450px] object-cover rounded-xl cursor-zoom-in"
                    onClick={() => setFullscreenImage(images[currentImageIndex])}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-background"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-background"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIndex(i)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                              i === currentImageIndex ? "border-primary" : "border-transparent opacity-60"
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-80 gradient-warm flex items-center justify-center rounded-xl">
                  <span className="text-7xl">🏠</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{product.category}</span>
              <h1 className="font-bold text-3xl">{product.name}</h1>

              {(product.internal_code || product.international_code) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {product.internal_code && (
                    <span className="bg-muted px-2 py-1 rounded-md font-mono">كود: {product.internal_code}</span>
                  )}
                  {product.international_code && (
                    <span className="bg-muted px-2 py-1 rounded-md font-mono">دولي: {product.international_code}</span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {isAdmin && product.purchase_price && (
                  <div className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    🛒 سعر الشراء: {product.purchase_price}
                  </div>
                )}
                {(isAdmin || isWholesale) && product.wholesale_price && (
                  <div className="text-base font-semibold text-accent-foreground bg-accent px-3 py-2 rounded-md">
                    💰 سعر الجملة: {product.wholesale_price}
                  </div>
                )}
                {!isWholesale && (
                  <div className="text-3xl font-bold text-primary">
                    🏷️ {product.price}
                  </div>
                )}
              </div>

              {product.benefits && product.benefits.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground">المميزات</h3>
                  <ul className="space-y-2">
                    {product.benefits.map((b) => (
                      <li key={b} className="text-sm flex items-center gap-2">
                        <span className="text-primary">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.specifications && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground">المواصفات</h3>
                  <p className="text-sm whitespace-pre-line leading-relaxed bg-muted/50 p-3 rounded-md">
                    {product.specifications}
                  </p>
                </div>
              )}

              {product.sizes && (
                <p className="text-sm text-muted-foreground">📐 المقاسات: {product.sizes}</p>
              )}

              <a
                href={getProductWhatsAppUrl(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full gradient-gold text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-gold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-5 h-5" />
                اطلب عبر واتساب
              </a>
            </div>
          </div>

          {/* Similar Products */}
          {similar.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-cairo font-bold mb-6">
                منتجات <span className="text-gradient-gold">مشابهة</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similar.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="bg-card rounded-2xl overflow-hidden shadow-warm border border-border hover:-translate-y-1 transition-transform"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" loading="lazy" />
                    ) : (
                      <div className="h-40 gradient-warm flex items-center justify-center">
                        <span className="text-4xl">🏠</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-2 line-clamp-2">{p.name}</h3>
                      <span className="text-lg font-bold text-primary">
                        {isWholesale ? (p.wholesale_price || p.price) : p.price}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={fullscreenImage} alt="" className="max-w-[95vw] max-h-[95vh] object-contain" />
        </div>
      )}
    </Layout>
  );
};

export default ProductDetail;
