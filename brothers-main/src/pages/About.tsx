import { Target, Eye, Handshake, Award } from "lucide-react";
import Layout from "@/components/Layout";

const values = [
  { icon: Award, title: "خبرة سنوات طويلة", desc: "خبرة واسعة في مجال الأجهزة المنزلية وتجهيزات العرائس تمتد لسنوات طويلة" },
  { icon: Handshake, title: "ثقة عملائنا", desc: "بنينا سمعتنا على الأمانة والمصداقية مع كل عميل" },
  { icon: Target, title: "أسعار عادلة", desc: "نحرص على تقديم أفضل الأسعار لعملاء الجملة والقطاعي" },
  { icon: Eye, title: "جودة مضمونة", desc: "نختار منتجاتنا بعناية لنقدم لكم أعلى مستوى من الجودة" },
];

const About = () => (
  <Layout>
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-cairo font-extrabold text-center mb-6">
          من <span className="text-gradient-gold">نحن</span>
        </h1>
        <p className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto leading-relaxed">
          معرض الأخوة لتجهيزات العرائس — رحلة بدأت بشغف خدمة كل بيت مصري
        </p>

        {/* Story */}
        <div className="bg-card rounded-2xl p-8 md:p-12 shadow-warm border border-border mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gradient-gold">قصتنا</h2>
          <p className="text-muted-foreground leading-loose">
            بدأ معرض الأخوة كحلم بسيط — إنّنا نوفر لكل عروسة وكل بيت أفضل الأجهزة المنزلية وأدوات المطبخ بأسعار عادلة. من بنها في قلب القليوبية، كبرنا وتوسعنا لفرعين، وخدمنا آلاف العملاء اللي وثقوا فينا. النهارده بنقدم تشكيلة واسعة من الحلل الجرانيت، الصيني، الأركوبال، الأجهزة الكهربائية، وباقات تجهيز العرائس الكاملة.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-secondary rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-3">🎯 رسالتنا</h2>
            <p className="text-muted-foreground leading-relaxed">
              نسعى لتوفير أفضل المنتجات المنزلية بأسعار مناسبة للجميع، مع تقديم خدمة عملاء مميزة تجعل تجربة التسوق ممتعة وسهلة.
            </p>
          </div>
          <div className="bg-secondary rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-3">👁️ رؤيتنا</h2>
            <p className="text-muted-foreground leading-relaxed">
              نطمح أن نكون الخيار الأول لكل بيت وعروسة في القليوبية ومصر، ونوسع خدماتنا لنوصل لكل عميل في أي مكان.
            </p>
          </div>
        </div>

        {/* Values */}
        <h2 className="text-2xl font-bold text-center mb-8">
          ليه عملاءنا <span className="text-gradient-gold">يثقوا فينا</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {values.map((v) => (
            <div key={v.title} className="flex gap-4 bg-card rounded-2xl p-6 shadow-warm border border-border">
              <div className="w-12 h-12 shrink-0 rounded-xl gradient-gold flex items-center justify-center">
                <v.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default About;
