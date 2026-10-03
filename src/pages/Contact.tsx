import { useState } from "react";
import { MapPin, Phone, MessageCircle, Send } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import Layout from "@/components/Layout";

const Contact = () => {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `السلام عليكم، أنا ${form.name}\nرقمي: ${form.phone}\n${form.message}`;
    window.open(getWhatsAppUrl(msg), "_blank");
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-cairo font-extrabold text-center mb-4">
            تواصل <span className="text-gradient-gold">معنا</span>
          </h1>
          <p className="text-center text-muted-foreground mb-16">نسعد بخدمتكم دايماً</p>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl p-6 shadow-warm border border-border">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  الفرع الرئيسي
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  منية السباع - بنها - قليوبية<br />
                  بجوار اتيلية ماسة وحلواني زمزم
                </p>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-warm border border-border">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  الفرع الثاني
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  شبلنجة - بنها - قليوبية<br />
                  بجوار موقف الصنافين وعيادة د/أيمن حمدي عاقول
                </p>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-warm border border-border">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  اتصل بنا
                </h3>
                <a href="tel:01126244664" className="text-primary font-bold text-lg">01126244664</a>
              </div>

              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full gradient-gold text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-gold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-5 h-5" />
                تواصل عبر واتساب
              </a>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-warm border border-border space-y-5">
              <h2 className="font-bold text-xl mb-2">أرسل لنا رسالة</h2>
              <p className="text-muted-foreground text-sm mb-4">سيتم إرسال رسالتك عبر واتساب</p>

              <div>
                <label className="text-sm font-medium mb-1 block">الاسم</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="اكتب اسمك"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="رقم الموبايل"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">الرسالة</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>

              <button
                type="submit"
                className="w-full gradient-gold text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-gold hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
                إرسال عبر واتساب
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
