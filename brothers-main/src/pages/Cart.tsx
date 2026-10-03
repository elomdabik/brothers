import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const Cart = () => (
  <Layout>
    <section className="container mx-auto px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
        <ShoppingCart className="h-9 w-9" />
      </div>
      <h1 className="text-3xl font-extrabold font-cairo mb-3">سلة المشتريات</h1>
      <p className="text-muted-foreground mb-7">السلة فارغة حاليًا. تصفح المنتجات واختر ما يناسبك.</p>
      <Button asChild size="lg">
        <Link to="/products">تصفح المنتجات</Link>
      </Button>
    </section>
  </Layout>
);

export default Cart;