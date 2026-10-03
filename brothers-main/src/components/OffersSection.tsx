import { useState, useEffect } from "react";
import { Flame, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getProductWhatsAppUrl } from "@/lib/whatsapp";
import { getActiveOffers } from "@/services/db/offers";

type Offer = {
  id: string;
  product_name: string;
  old_price: string;
  new_price: string;
  discount_percent: number;
  emoji: string | null;
  expires_at: string | null;
};

const getTarget = () => {
  const stored = sessionStorage.getItem("offer-target");
  if (stored) return Number(stored);
  const t = Date.now() + 3 * 24 * 60 * 60 * 1000;
  sessionStorage.setItem("offer-target", String(t));
  return t;
};

const useCountdown = () => {
  const [target] = useState(getTarget);
  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc), 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 14 },
  },
};

const countdownVariants = {
  hidden: { opacity: 0, scale: 0.5, rotateX: 90 },
  visible: (i: number) => ({
    opacity: 1, scale: 1, rotateX: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 12, delay: i * 0.1 },
  }),
};

const OffersSection = () => {
  const { days, hours, minutes, seconds } = useCountdown();
  const { data: offersData = [], isLoading } = useQuery({
    queryKey: ["offers", "active"],
    queryFn: getActiveOffers,
  });
  const offers = offersData as Offer[];

  if (isLoading || offers.length === 0) return null;

  return (
    <section className="py-20 bg-foreground text-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center gap-3 mb-3"
        >
          <Flame className="w-7 h-7 text-gold-light animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-cairo font-extrabold text-center">
            عروض <span className="text-gold-light">لفترة محدودة</span>
          </h2>
          <Flame className="w-7 h-7 text-gold-light animate-pulse" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center text-background/60 mb-8"
        >
          اغتنم الفرصة قبل انتهاء العرض!
        </motion.p>

        <div className="flex justify-center gap-3 md:gap-5 mb-12">
          {[
            { label: "يوم", value: days },
            { label: "ساعة", value: hours },
            { label: "دقيقة", value: minutes },
            { label: "ثانية", value: seconds },
          ].map((u, i) => (
            <motion.div key={u.label} custom={i} variants={countdownVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
              <motion.div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl gradient-gold flex items-center justify-center shadow-gold" whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }} transition={{ duration: 0.3 }}>
                <span className="text-2xl md:text-3xl font-extrabold text-primary-foreground">{String(u.value).padStart(2, "0")}</span>
              </motion.div>
              <span className="text-xs text-background/50 mt-2 block">{u.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {offers.map((o) => (
            <motion.div key={o.id} variants={itemVariants} whileHover={{ y: -8, boxShadow: "0 20px 50px -12px hsl(38 75% 50% / 0.25)" }} className="bg-background/5 backdrop-blur-sm border border-background/10 rounded-2xl p-6 transition-colors">
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 200, delay: 0.4 }} className="inline-block bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full mb-4">
                خصم {o.discount_percent}%
              </motion.div>
              <h3 className="font-bold text-lg text-background mb-3">{o.emoji} {o.product_name}</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-extrabold text-gold-light">{o.new_price} ج.م</span>
                <span className="text-sm text-background/40 line-through">{o.old_price} ج.م</span>
              </div>
              <motion.a href={getProductWhatsAppUrl(o.product_name)} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full gradient-gold text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-gold">
                <MessageCircle className="w-4 h-4" />
                اطلب الآن
              </motion.a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default OffersSection;
