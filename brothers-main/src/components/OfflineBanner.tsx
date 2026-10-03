import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/services/db/network";

const OfflineBanner = () => {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="bg-foreground text-background text-xs sm:text-sm py-2 px-3 flex items-center justify-center gap-2 sticky top-0 z-50">
      <WifiOff className="w-4 h-4" />
      <span>أنت غير متصل بالإنترنت — المحتوى المعروض قد لا يكون محدّث</span>
    </div>
  );
};

export default OfflineBanner;
