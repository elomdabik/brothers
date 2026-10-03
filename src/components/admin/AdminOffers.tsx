import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { refreshTable } from "@/services/db/sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil, Plus, Search } from "lucide-react";

type ProductLite = { id: string; name: string; price: string };

type Offer = {
  id: string;
  product_name: string;
  old_price: string;
  new_price: string;
  discount_percent: number;
  emoji: string | null;
  active: boolean | null;
  expires_at: string | null;
};

const emptyOffer = {
  product_name: "",
  old_price: "",
  new_price: "",
  discount_percent: "",
  emoji: "🔥",
  active: true,
  expires_at: "",
};

const AdminOffers = () => {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [form, setForm] = useState(emptyOffer);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchOffers = async () => {
    const { data } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
    if (data) setOffers(data as Offer[]);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name, price").order("name");
    if (data) setProducts(data as ProductLite[]);
  };

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim();
    if (!q) return [];
    return products.filter(p => p.name.includes(q)).slice(0, 8);
  }, [productSearch, products]);

  const selectProduct = (p: ProductLite) => {
    setForm(f => ({
      ...f,
      product_name: p.name,
      old_price: p.price,
      new_price: f.new_price || p.price,
    }));
    setProductSearch(p.name);
    setShowSuggestions(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      product_name: form.product_name,
      old_price: form.old_price,
      new_price: form.new_price,
      discount_percent: parseInt(form.discount_percent) || 0,
      emoji: form.emoji || "🔥",
      active: form.active,
      expires_at: form.expires_at || null,
    };

    let saveError: { message: string } | null = null;
    if (editingId) {
      const { error } = await supabase.from("offers").update(payload).eq("id", editingId);
      if (error) saveError = error;
    } else {
      const { error } = await supabase.from("offers").insert(payload);
      if (error) saveError = error;
    }
    if (saveError) {
      toast({ title: "خطأ", description: saveError.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "تم تحديث العرض" : "تم إضافة العرض" });
      await refreshTable("offers");
    }
    setSaving(false);
    resetForm();
    fetchOffers();
  };

  const handleEdit = (o: Offer) => {
    setEditingId(o.id);
    setForm({
      product_name: o.product_name,
      old_price: o.old_price,
      new_price: o.new_price,
      discount_percent: String(o.discount_percent),
      emoji: o.emoji || "🔥",
      active: o.active ?? true,
      expires_at: o.expires_at ? o.expires_at.split("T")[0] : "",
    });
    setProductSearch(o.product_name);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("offers").delete().eq("id", id);
    if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
    else {
      toast({ title: "تم حذف العرض" });
      await refreshTable("offers");
      fetchOffers();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("offers").update({ active }).eq("id", id);
    if (!error) {
      await refreshTable("offers");
      fetchOffers();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyOffer);
    setProductSearch("");
    setShowSuggestions(false);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">إدارة العروض</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gradient-gold text-primary-foreground font-bold">
            <Plus className="w-4 h-4 ml-1" />
            إضافة عرض
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-card rounded-2xl p-6 border border-border space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 relative">
              <Label>ابحث عن المنتج بالاسم</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={productSearch}
                  onChange={(e) => {
                    const v = e.target.value;
                    setProductSearch(v);
                    setForm({ ...form, product_name: v });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  required
                  placeholder="اكتب اسم المنتج..."
                  className="pr-9"
                  dir="rtl"
                />
              </div>
              {showSuggestions && filteredProducts.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p)}
                      className="w-full text-right px-4 py-2 hover:bg-muted transition-colors flex items-center justify-between gap-3"
                    >
                      <span className="text-xs text-muted-foreground">{p.price}</span>
                      <span className="font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>السعر القديم</Label>
              <Input value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} required placeholder="1,500 ج.م" />
            </div>
            <div className="space-y-2">
              <Label>السعر الجديد</Label>
              <Input value={form.new_price} onChange={(e) => setForm({ ...form, new_price: e.target.value })} required placeholder="1,200 ج.م" />
            </div>
            <div className="space-y-2">
              <Label>نسبة الخصم %</Label>
              <Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} required placeholder="20" />
            </div>
            <div className="space-y-2">
              <Label>الإيموجي</Label>
              <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🔥" />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء (اختياري)</Label>
              <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
              <Label>فعّال</Label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="gradient-gold text-primary-foreground font-bold">
              {saving ? "جاري الحفظ..." : editingId ? "تحديث" : "إضافة"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
          </div>
        </form>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المنتج</TableHead>
              <TableHead>السعر القديم</TableHead>
              <TableHead>السعر الجديد</TableHead>
              <TableHead>الخصم</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.emoji} {o.product_name}</TableCell>
                <TableCell className="line-through text-muted-foreground">{o.old_price}</TableCell>
                <TableCell className="font-bold">{o.new_price}</TableCell>
                <TableCell>{o.discount_percent}%</TableCell>
                <TableCell>
                  <Switch checked={o.active ?? false} onCheckedChange={(checked) => toggleActive(o.id, checked)} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(o)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(o.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {offers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد عروض حالياً</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOffers;
