import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PartyPopper, Check, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { customFetch } from "@/lib/custom-fetch";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const toastedRef = useRef(false);

  const { data } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () =>
      customFetch("/api/notifications").then(r =>
        r.ok ? r.json() : { notifications: [], unreadCount: 0 }
      ),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount: number = data?.unreadCount ?? 0;

  // On first load: pop a toast for every unread notification not yet shown this session
  useEffect(() => {
    if (toastedRef.current || !notifications.length) return;
    const shownKey = "nfgn_notif_toasted";
    const alreadyShown: number[] = JSON.parse(sessionStorage.getItem(shownKey) ?? "[]");
    const toShow = notifications.filter(n => !n.isRead && !alreadyShown.includes(n.id));
    if (!toShow.length) return;
    toastedRef.current = true;
    toShow.forEach((n, i) => {
      setTimeout(() => {
        toast({
          title: "🎉 Community Update",
          description: n.message,
          duration: 6000,
        });
      }, i * 800);
    });
    sessionStorage.setItem(shownKey, JSON.stringify([...alreadyShown, ...toShow.map(n => n.id)]));
  }, [notifications, toast]);

  const markAllRead = useMutation({
    mutationFn: () =>
      customFetch("/api/notifications/read-all", { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markOneRead = useMutation({
    mutationFn: (id: number) =>
      customFetch(`/api/notifications/${id}/read`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  if (notifications.length === 0) return null;

  return (
    <Card className="overflow-hidden" style={{ borderColor: unreadCount > 0 ? "#C9A84C" : undefined }}>
      <CardHeader
        className="pb-3 border-b"
        style={{
          background: unreadCount > 0
            ? "linear-gradient(135deg, #faf8f3, #f5f0e8)"
            : undefined,
          borderBottom: unreadCount > 0 ? "1px solid #e8dfc8" : undefined,
        }}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-primary" />
            Community Activity
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount} new
              </span>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y max-h-80 overflow-y-auto">
          {notifications.slice(0, 10).map(n => (
            <div
              key={n.id}
              className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors hover:bg-muted/40 ${
                !n.isRead ? "bg-amber-50/60 dark:bg-amber-950/20" : ""
              }`}
              onClick={() => { if (!n.isRead) markOneRead.mutate(n.id); }}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  !n.isRead ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                }`}
              >
                <PartyPopper className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${
                    !n.isRead ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {n.message}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        {notifications.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No notifications yet.</p>
            <p className="text-xs mt-1 opacity-70">You'll see new member activity here!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
