import { useState } from "react";
import { MessageCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getProductWhatsAppUrl } from "@/lib/whatsapp";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useRequireLogin } from "@/hooks/useRequireLogin";

export type Product = {
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
};

const getAllImages = (p: Product) => {
  const images: string[] = [];
  if (p.image_url) images.push(p.image_url);
  if (p.additional_images) images.push(...p.additional_images.filter(Boolean));
  return images;
};

interface Props {
  product: Product | null;
  onClose: () => void;
}

const ProductDetailDialog = ({ product, onClose }: Props) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const { canSeeWholesale, isAdmin } = useAuth();
  const requireLogin = useRequireLogin();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setCurrentImageIndex(0);
      setFullscreenImage(null);
    }
  };

  if (!product) return null;

  const images = getAllImages(product);

  return (
    <>
      <Dialog open={!!product} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          {/* Image Gallery */}
          {images.length > 0 ? (
            <div className="relative">
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-80 sm:h-[450px] object-cover cursor-zoom-in"
                onClick={() => setFullscreenImage(images[currentImageIndex])}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          i === currentImageIndex ? "bg-primary" : "bg-background/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-64 gradient-warm flex items-center justify-center">
              <span className="text-7xl">🏠</span>
            </div>
          )}

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{product.category}</span>
                <h2 className="font-bold text-2xl mt-2">{product.name}</h2>
                {(product.internal_code || product.international_code) && (
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {product.internal_code && (
                      <span className="bg-muted px-2 py-1 rounded-md font-mono">كود: {product.internal_code}</span>
                    )}
                    {product.international_code && (
                      <span className="bg-muted px-2 py-1 rounded-md font-mono">دولي: {product.international_code}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-left space-y-1">
                {isAdmin && product.purchase_price && (
                  <div className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md whitespace-nowrap">
                    🛒 شراء: {product.purchase_price}
                  </div>
                )}
                {canSeeWholesale && product.wholesale_price && (
                  <div className="text-sm font-semibold text-accent-foreground bg-accent px-2 py-1 rounded-md whitespace-nowrap">
                    💰 جملة: {product.wholesale_price}
                  </div>
                )}
                {(!canSeeWholesale || isAdmin) && (
                  <div className="text-2xl font-bold text-primary whitespace-nowrap">
                    🏷️ بيع: {product.price}
                  </div>
                )}
              </div>
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

            {product.sizes && (
              <p className="text-sm text-muted-foreground">📐 المقاسات: {product.sizes}</p>
            )}

            <a
              href={getProductWhatsAppUrl(product.name)}
              onClick={requireLogin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full gradient-gold text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-gold hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-5 h-5" />
              اطلب عبر واتساب
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Overlay */}
      {fullscreenImage && (() => {
        const fullscreenIndex = images.indexOf(fullscreenImage);
        return (
          <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-zoom-out"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-2 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); const i = fullscreenIndex > 0 ? fullscreenIndex - 1 : images.length - 1; setFullscreenImage(images[i]); setCurrentImageIndex(i); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 rounded-full p-3 z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); const i = fullscreenIndex < images.length - 1 ? fullscreenIndex + 1 : 0; setFullscreenImage(images[i]); setCurrentImageIndex(i); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 rounded-full p-3 z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}
            <img
              src={fullscreenImage}
              alt="صورة مكبرة"
              className="max-w-[95vw] max-h-[95vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      })()}
    </>
  );
};

export default ProductDetailDialog;
