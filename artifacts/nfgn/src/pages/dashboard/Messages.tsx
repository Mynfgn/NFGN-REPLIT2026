import { useState } from "react";
import { useListMessages, useMarkMessageRead } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Megaphone } from "lucide-react";

export function MessagesPage() {
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  const { data, isLoading, refetch } = useListMessages({ page: 1, limit: 50 });
  const markRead = useMarkMessageRead();

  const messages = data?.messages ?? [];
  const inbox = messages.filter((m: any) => !m.fromUserId || m.isBroadcast);
  const sent = messages.filter((m: any) => m.fromUserId && !m.isBroadcast);
  const unread = data?.unreadCount ?? 0;

  function openMessage(msg: any) {
    setSelectedMsg(msg);
    if (!msg.isRead) {
      markRead.mutate({ id: msg.id }, { onSuccess: () => refetch() });
    }
  }

  function MessageList({ msgs }: { msgs: any[] }) {
    if (msgs.length === 0) {
      return <p className="text-center text-muted-foreground py-12">No messages.</p>;
    }
    return (
      <div className="space-y-2">
        {msgs.map((msg: any) => (
          <div
            key={msg.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:border-primary/30 ${!msg.isRead ? "bg-primary/5 border-primary/20" : ""}`}
            onClick={() => openMessage(msg)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {msg.isBroadcast ? <Megaphone className="h-4 w-4 text-primary" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
                <span className="font-medium text-sm">{msg.fromUserName}</span>
                {!msg.isRead && <Badge className="text-xs h-4">New</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="font-semibold text-sm truncate">{msg.subject}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body.substring(0, 100)}...</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Messages</h1>
        <p className="text-muted-foreground">{unread > 0 ? `${unread} unread message${unread > 1 ? "s" : ""}` : "No unread messages"}</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">
            Inbox {unread > 0 && <Badge className="ml-2 text-xs h-4">{unread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <MessageList msgs={inbox} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <MessageList msgs={sent} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedMsg} onOpenChange={open => !open && setSelectedMsg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{selectedMsg?.subject}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground border-b pb-4">
              <span>From: <span className="font-medium text-foreground">{selectedMsg?.fromUserName}</span></span>
              <span>{selectedMsg && new Date(selectedMsg.createdAt).toLocaleString()}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{selectedMsg?.body}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
