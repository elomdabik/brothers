import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getProducts } from "@/services/db/products";
import { refreshTable } from "@/services/db/sync";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { Trash2, Pencil, Plus, LogOut, Upload, ImageIcon, X, Lock, Users, RefreshCw, Shield, Tag } from "lucide-react";
import AdminOffers from "@/components/admin/AdminOffers";

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  benefits: string[];
  sizes: string | null;
  image_url: string | null;
  additional_images: string[] | null;
};

type RegisteredProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  approved: boolean;
  created_at: string;
};

type ManagedRole = "product_manager" | "wholesale";
type AppRole = Database["public"]["Enums"]["app_role"];

const isMissingTableError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";

  return code === "PGRST205" || code === "42P01" || message.toLowerCase().includes("could not find the table") || message.toLowerCase().includes("does not exist");
};

const emptyProduct = { name: "", category: "", price: "", purchase_price: "", wholesale_price: "", benefits: "", sizes: "", image_url: "", internal_code: "", international_code: "", specifications: "" };

const Admin = () => {
  const { isAuthenticated, isAdmin, canManageProducts, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<RegisteredProfile[]>([]);
  const [profileRoles, setProfileRoles] = useState<Record<string, AppRole[]>>({});
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const fetchProducts = async () => {
    const data = await getProducts({});
    setProducts(data as unknown as Product[]);
  };

  const fetchProfiles = async () => {
    setProfilesLoading(true);
    setProfilesError(null);
    const [profilesResult, rolesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, user_id, display_name, email, phone, approved, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    setProfilesLoading(false);
    if (profilesResult.error || rolesResult.error) {
      const error = profilesResult.error ?? rolesResult.error;
      if (isMissingTableError(error)) {
        setProfilesError("جدول صلاحيات المستخدمين غير مهيأ في قاعدة البيانات. بعض الصلاحيات غير متاحة مؤقتًا.");
      } else {
        setProfilesError(error.message);
      }
      return;
    }
    setProfiles(profilesResult.data ?? []);
    const rolesByUser: Record<string, AppRole[]> = {};
    for (const { user_id, role } of rolesResult.data ?? []) {
      (rolesByUser[user_id] ??= []).push(role);
    }
    setProfileRoles(rolesByUser);
  };

  useEffect(() => {
    if (canManageProducts) fetchProducts();
  }, [canManageProducts]);

  useEffect(() => {
    if (isAdmin && activeTab === "users") void fetchProfiles();
  }, [isAdmin, activeTab]);

  const handleRoleChange = async (profile: RegisteredProfile, role: ManagedRole) => {
    const currentRoles = profileRoles[profile.user_id] ?? [];
    const shouldAssign = !currentRoles.includes(role);
    setUpdatingRole(`${profile.user_id}:${role}`);

    const result = shouldAssign
      ? await supabase.from("user_roles").insert({ user_id: profile.user_id, role })
      : await supabase.from("user_roles").delete().eq("user_id", profile.user_id).eq("role", role);

    setUpdatingRole(null);
    if (result.error) {
      toast({ title: "تعذّر تحديث صلاحية المستخدم", description: result.error.message, variant: "destructive" });
      return;
    }
    toast({ title: shouldAssign ? "تمت إضافة الصلاحية" : "تمت إزالة الصلاحية" });
    await fetchProfiles();
  };

  const handleAdminSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "تعذّر تسجيل الخروج", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const filePath = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(filePath, file);
    if (error) {
      toast({ title: "خطأ في رفع الصورة", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAdditionalFiles(prev => [...prev, ...files]);
      setAdditionalPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeAdditionalImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      const existingCount = additionalPreviews.length - additionalFiles.length;
      const fileIndex = index - existingCount;
      setAdditionalFiles(prev => prev.filter((_, i) => i !== fileIndex));
      setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploading(true);
    const benefitsArr = form.benefits.split("،").map((b) => b.trim()).filter(Boolean);

    let imageUrl = form.image_url || null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) { setSaving(false); setUploading(false); return; }
    }

    const existingAdditional = additionalPreviews.filter(p => p.startsWith("http"));
    const newUploads: string[] = [];
    for (const file of additionalFiles) {
      const url = await uploadImage(file);
      if (url) newUploads.push(url);
    }
    const allAdditional = [...existingAdditional, ...newUploads];

    setUploading(false);

    const payload = {
      name: form.name,
      category: form.category,
      price: form.price,
      purchase_price: form.purchase_price || null,
      wholesale_price: form.wholesale_price || null,
      internal_code: form.internal_code,
      international_code: form.international_code || null,
      benefits: benefitsArr,
      sizes: form.sizes || null,
      specifications: form.specifications || null,
      image_url: imageUrl,
      additional_images: allAdditional,
    };

    let saveError: { message: string } | null = null;
    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) saveError = error;
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) saveError = error;
    }
    if (saveError) {
      toast({ title: "خطأ", description: saveError.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "تم تحديث المنتج" : "تم إضافة المنتج" });
      await refreshTable("products");
    }
    setSaving(false);
    resetForm();
    fetchProducts();
    setActiveTab("products");
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, category: p.category, price: p.price, purchase_price: (p as any).purchase_price || "", wholesale_price: (p as any).wholesale_price || "", internal_code: (p as any).internal_code || "", international_code: (p as any).international_code || "", benefits: p.benefits.join("، "), sizes: p.sizes || "", image_url: p.image_url || "", specifications: (p as any).specifications || "" });
    setImagePreview(p.image_url || null);
    setImageFile(null);
    setAdditionalFiles([]);
    setAdditionalPreviews(p.additional_images || []);
    setActiveTab("add");
  };

  const handleDelete = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product?.image_url) {
      const path = product.image_url.split("/product-images/").pop();
      if (path) await supabase.storage.from("product-images").remove([path]);
    }
    if (product?.additional_images) {
      const paths = product.additional_images.map(url => url.split("/product-images/").pop()).filter(Boolean) as string[];
      if (paths.length) await supabase.storage.from("product-images").remove(paths);
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
    else {
      toast({ title: "تم حذف المنتج" });
      await refreshTable("products");
      fetchProducts();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setImageFile(null);
    setImagePreview(null);
    setAdditionalFiles([]);
    setAdditionalPreviews([]);
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="py-20 text-center text-muted-foreground">جاري التحقق من الصلاحيات...</section>
      </Layout>
    );
  }

  if (!canManageProducts) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-gold text-primary-foreground">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mb-2 text-2xl font-cairo font-bold">لوحة التحكم</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {isAuthenticated
                ? "حسابك لا يملك صلاحية إدارة المنتجات. اطلب من الأدمن تعيينك مشرفًا عامًا."
                : "سجّل الدخول بحساب المشرف أو الأدمن للوصول إلى لوحة التحكم."}
            </p>
            {!isAuthenticated && (
              <Button asChild className="gradient-gold text-primary-foreground font-bold">
                <Link to="/login?next=%2Fadmin">تسجيل الدخول</Link>
              </Button>
            )}
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-cairo font-bold">
              <span className="text-gradient-gold">لوحة التحكم</span>
            </h1>
            <Button variant="ghost" size="sm" onClick={() => void handleAdminSignOut()}>
              <LogOut className="w-4 h-4 ml-1" /> خروج
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="mb-6">
              <TabsTrigger value="products">المنتجات</TabsTrigger>
              <TabsTrigger value="add">{editingId ? "تعديل منتج" : "إضافة منتج"}</TabsTrigger>
              <TabsTrigger value="offers">العروض</TabsTrigger>
              {isAdmin && <TabsTrigger value="users">المستخدمون</TabsTrigger>}
            </TabsList>

            {isAdmin && <TabsContent value="users">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  بيانات الحسابات المسجلة المتاحة للأدمن.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => void fetchProfiles()} disabled={profilesLoading}>
                  <RefreshCw className={`ml-2 h-4 w-4 ${profilesLoading ? "animate-spin" : ""}`} />
                  تحديث
                </Button>
              </div>
              {profilesError ? (
                <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  تعذّر تحميل المستخدمين. تأكد من تسجيل الدخول بحساب لديه صلاحية أدمن في Supabase.
                  <p dir="ltr" className="mt-2 break-all text-xs">{profilesError}</p>
                </div>
              ) : profilesLoading ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                  جاري تحميل المستخدمين...
                </div>
              ) : profiles.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 h-8 w-8" />
                  لا توجد حسابات مسجلة حتى الآن.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>رقم الهاتف</TableHead>
                        <TableHead>الصلاحيات</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ التسجيل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.display_name || "—"}</TableCell>
                          <TableCell dir="ltr" className="text-right">{profile.email || "—"}</TableCell>
                          <TableCell dir="ltr" className="text-right">{profile.phone || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {profileRoles[profile.user_id]?.includes("admin") && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                  <Shield className="h-3.5 w-3.5" /> أدمن
                                </span>
                              )}
                              {!(profileRoles[profile.user_id] ?? []).some((role) =>
                                role === "admin" || role === "product_manager" || role === "wholesale"
                              ) && (
                                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                  قطاعي
                                </span>
                              )}
                              {(["product_manager", "wholesale"] as const).map((role) => {
                                const assigned = (profileRoles[profile.user_id] ?? []).includes(role);
                                const roleLabel = role === "product_manager" ? "مشرف عام" : "جملة";
                                const RoleIcon = role === "product_manager" ? Shield : Tag;
                                return (
                                  <Button
                                    key={role}
                                    type="button"
                                    size="sm"
                                    variant={assigned ? "default" : "outline"}
                                    disabled={updatingRole !== null}
                                    onClick={() => void handleRoleChange(profile, role)}
                                  >
                                    <RoleIcon className="ml-1 h-3.5 w-3.5" />
                                    {updatingRole === `${profile.user_id}:${role}` ? "جاري التحديث..." : `${assigned ? "إزالة" : "تعيين"} ${roleLabel}`}
                                  </Button>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={profile.approved ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                              {profile.approved ? "مفعل" : "بانتظار التفعيل"}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(profile.created_at).toLocaleDateString("ar-EG")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>}

            <TabsContent value="products">
              <div className="mb-4">
                <Input
                  placeholder="🔍 ابحث عن منتج بالاسم أو الفئة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                  dir="rtl"
                />
              </div>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الصورة</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>سعر البيع</TableHead>
                      <TableHead>سعر الشراء</TableHead>
                      <TableHead>سعر الجملة</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.filter(p => p.name.includes(searchQuery) || p.category.includes(searchQuery) || ((p as any).internal_code || "").includes(searchQuery) || ((p as any).international_code || "").includes(searchQuery)).map((p) => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(p)}>
                        <TableCell>
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell>{p.price}</TableCell>
                        <TableCell>{(p as any).purchase_price || "—"}</TableCell>
                        <TableCell>{(p as any).wholesale_price || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="add">
              <form onSubmit={handleSave} className="bg-card rounded-2xl p-8 border border-border space-y-5 max-w-2xl">
                <div className="space-y-2">
                  <Label>اسم المنتج</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required placeholder="مثال: حلل جرانيت" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الكود الداخلي *</Label>
                    <Input value={form.internal_code} onChange={(e) => setForm({ ...form, internal_code: e.target.value })} required placeholder="مثال: A-1023" />
                  </div>
                  <div className="space-y-2">
                    <Label>الكود الدولي (اختياري)</Label>
                    <Input value={form.international_code} onChange={(e) => setForm({ ...form, international_code: e.target.value })} placeholder="مثال: 8901234567890" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>سعر الشراء (لا يظهر للعملاء)</Label>
                  <Input value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} placeholder="مثال: 800 ج.م" />
                </div>
                <div className="space-y-2">
                  <Label>سعر الجملة (يظهر في وضع الجملة فقط)</Label>
                  <Input value={form.wholesale_price} onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })} placeholder="مثال: 900 ج.م" />
                </div>
                <div className="space-y-2">
                  <Label>سعر البيع (قطاعي)</Label>
                  <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="مثال: 1,200 ج.م" />
                </div>
                <div className="space-y-2">
                  <Label>المميزات (مفصولة بفاصلة عربية ،)</Label>
                  <Input value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} placeholder="ميزة 1، ميزة 2، ميزة 3" />
                </div>
                <div className="space-y-2">
                  <Label>المقاسات / الحجم</Label>
                  <Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>المواصفات (تظهر في صفحة المنتج)</Label>
                  <Textarea value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} rows={5} placeholder="اكتب مواصفات تفصيلية للمنتج (المادة، الوزن، الأبعاد، الضمان...)" />
                </div>
                <div className="space-y-2">
                  <Label>الصورة الرئيسية</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">{imageFile ? imageFile.name : "اختر صورة"}</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {imagePreview && (
                      <img src={imagePreview} alt="معاينة" className="w-16 h-16 rounded-lg object-cover border border-border" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>صور إضافية</Label>
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors w-fit">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">إضافة صور</span>
                    <input type="file" accept="image/*" multiple onChange={handleAdditionalImages} className="hidden" />
                  </label>
                  {additionalPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {additionalPreviews.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} alt={`صورة ${i + 1}`} className="w-20 h-20 rounded-lg object-cover border border-border" />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(i, src.startsWith("http"))}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving || uploading} className="gradient-gold text-primary-foreground font-bold">
                    <Plus className="w-4 h-4 ml-1" />
                    {uploading ? "جاري رفع الصور..." : saving ? "جاري الحفظ..." : editingId ? "تحديث" : "إضافة"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={() => { resetForm(); setActiveTab("products"); }}>
                      إلغاء
                    </Button>
                  )}
                </div>
              </form>
            </TabsContent>

            <TabsContent value="offers">
              <AdminOffers />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
