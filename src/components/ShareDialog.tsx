import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Facebook, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  title?: string;
  text?: string;
  url?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ShareDialog = ({
  title = "معرض الأخوة لتجهيزات العرائس",
  text = "تسوّق أفضل الأجهزة المنزلية وأدوات المطبخ وتجهيزات العرائس بأسعار الجملة والقطاعي من معرض الأخوة",
  url,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ShareDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const shareUrl = url || (typeof window !== "undefined" ? window.location.origin : "");
  const fullMessage = `${text}\n${shareUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط التطبيق إلى الحافظة بنجاح.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: "تعذّر النسخ",
        description: "يرجى تحديد الرابط ونسخه يدويًا.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        setOpen(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
        }
      }
    } else {
      handleCopy();
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl font-cairo font-bold text-gradient-gold">
            <Share2 className="w-5 h-5 text-primary" />
            مشاركة التطبيق
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            شارك رابط معرض الأخوة مع أصدقائك وعائلتك للاطلاع على أحدث العروض والمنتجات.
          </p>

          {/* Social share options */}
          <div className="grid grid-cols-3 gap-3">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-border bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all text-xs font-semibold"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              واتساب
            </a>

            <a
              href={facebookShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-border bg-[#1877f2]/10 text-[#1877f2] hover:bg-[#1877f2]/20 transition-all text-xs font-semibold"
            >
              <div className="w-10 h-10 rounded-full bg-[#1877f2] text-white flex items-center justify-center shadow-sm">
                <Facebook className="w-5 h-5" />
              </div>
              فيسبوك
            </a>

            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-border bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-all text-xs font-semibold"
            >
              <div className="w-10 h-10 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-sm">
                <Send className="w-5 h-5" />
              </div>
              تليجرام
            </a>
          </div>

          {/* Direct link copying */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              رابط المشاركة المباشر
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                dir="ltr"
                className="text-xs font-mono bg-muted"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopy}
                className="shrink-0 gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "تم النسخ" : "نسخ"}
              </Button>
            </div>
          </div>

          {/* Native mobile share if supported */}
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <Button
              type="button"
              onClick={handleNativeShare}
              className="w-full gradient-gold text-primary-foreground font-semibold gap-2"
            >
              <Share2 className="w-4 h-4" />
              مشاركة عبر تطبيقات أخرى
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
