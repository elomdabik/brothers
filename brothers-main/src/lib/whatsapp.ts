const PHONE = "2001126244664";

export const getWhatsAppUrl = (message: string = "السلام عليكم، أريد الاستفسار عن المنتجات") => {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
};

export const getProductWhatsAppUrl = (productName: string) => {
  return getWhatsAppUrl(`السلام عليكم، كنت عايز أطلب المنتج ده: ${productName}`);
};

export const getWholesaleWhatsAppUrl = () => {
  return getWhatsAppUrl("السلام عليكم، أريد الاستفسار عن أسعار الجملة");
};

export const getBridePackageWhatsAppUrl = (packageName: string) => {
  return getWhatsAppUrl(`السلام عليكم، أريد الاستفسار عن باقة تجهيز العرائس: ${packageName}`);
};
