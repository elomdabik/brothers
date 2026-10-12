export const shareApp = async () => {
  const shareData = {
    title: "معرض الأخوة لتجهيزات العرائس",
    text: "تصفح أفضل أسعار الجملة والقطاعي للأجهزة المنزلية وأدوات المطبخ وتجهيزات العرائس في بنها والقليوبية",
    url: window.location.origin,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Error sharing:", err);
      }
      return false;
    }
  } else {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      return "copied";
    } catch (err) {
      console.error("Failed to copy:", err);
      return false;
    }
  }
};

export const shareProduct = async (product: { name: string; price: string; id: string }) => {
  const url = `${window.location.origin}/products/${product.id}`;
  const shareData = {
    title: product.name,
    text: `منتج من معرض الأخوة: ${product.name} - السعر: ${product.price}`,
    url,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Error sharing:", err);
      }
      return false;
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch (err) {
      console.error("Failed to copy:", err);
      return false;
    }
  }
};
