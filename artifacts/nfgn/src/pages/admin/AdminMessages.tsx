import { useState } from "react";
import {
  useListMessages,
  useSendMessage,
  useBroadcastMessage,
  useMarkMessageRead,
  useListUsers,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, Megaphone, Send, Users, Inbox, PenSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminMessagesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"inbox" | "compose" | "broadcast">("inbox");
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);

  // Compose state
  const [recipientId, setRecipientId] = useState<string>("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // Broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastRole, setBroadcastRole] = useState<string>("all");

  const { data: msgData, isLoading: msgsLoading } = useListMessages({ page: 1, limit: 100 });
  const { data: usersData, isLoading: usersLoading } = useListUsers({ limit: 200 } as any);
  const markRead = useMarkMessageRead();
  const sendMessage = useSendMessage();
  const broadcastMessage = useBroadcastMessage();

  const messages = msgData?.messages ?? [];
  const users = usersData?.users ?? [];

  function openMessage(msg: any) {
    setSelectedMsg(msg);
    if (!msg.isRead) {
      markRead.mutate({ id: msg.id }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/messages"] }),
      });
    }
  }

  function handleSend() {
    if (!recipientId || !composeSubject.trim() || !composeBody.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    sendMessage.mutate(
      { data: { toUserId: parseInt(recipientId), subject: composeSubject, body: composeBody } } as any,
      {
        onSuccess: () => {
          toast({ title: "Message sent", description: "Your message has been delivered." });
          setRecipientId("");
          setComposeSubject("");
          setComposeBody("");
          qc.invalidateQueries({ queryKey: ["/api/messages"] });
          setTab("inbox");
        },
        onError: () => toast({ title: "Error", description: "Failed to send message.", variant: "destructive" }),
      }
    );
  }

  function handleBroadcast() {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      toast({ title: "Missing fields", description: "Please fill in subject and body.", variant: "destructive" });
      return;
    }
    broadcastMessage.mutate(
      { data: { subject: broadcastSubject, body: broadcastBody, targetRole: broadcastRole === "all" ? undefined : broadcastRole } } as any,
      {
        onSuccess: () => {
          toast({ title: "Broadcast sent", description: "Your announcement has been delivered to all members." });
          setBroadcastSubject("");
          setBroadcastBody("");
          setBroadcastRole("all");
          qc.invalidateQueries({ queryKey: ["/api/messages"] });
          setTab("inbox");
        },
        onError: () => toast({ title: "Error", description: "Failed to send broadcast.", variant: "destructive" }),
      }
    );
  }

  const unread = messages.filter((m: any) => !m.isRead && !m.isBroadcast).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Send direct messages or broadcasts to members
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab("compose")} className="gap-2">
            <PenSquare className="h-4 w-4" /> Compose
          </Button>
          <Button onClick={() => setTab("broadcast")} className="gap-2">
            <Megaphone className="h-4 w-4" /> Broadcast
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unread}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {unread > 0 && <Badge className="ml-1 text-xs h-4 px-1.5">{unread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <PenSquare className="h-4 w-4" /> Compose
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-2">
            <Megaphone className="h-4 w-4" /> Broadcast
          </TabsTrigger>
        </TabsList>

        {/* ── INBOX ── */}
        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle>All Messages</CardTitle>
              <CardDescription>Direct messages and member communications</CardDescription>
            </CardHeader>
            <CardContent>
              {msgsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No messages yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30 ${!msg.isRead ? "bg-primary/5 border-primary/20" : ""}`}
                      onClick={() => openMessage(msg)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {msg.isBroadcast
                            ? <Megaphone className="h-4 w-4 text-primary" />
                            : <Mail className="h-4 w-4 text-muted-foreground" />
                          }
                          <span className="font-medium text-sm">
                            {msg.isBroadcast ? "Broadcast" : `From: ${msg.fromUserName}`}
                          </span>
                          {msg.isBroadcast && (
                            <Badge variant="secondary" className="text-xs h-4">Announcement</Badge>
                          )}
                          {!msg.isRead && (
                            <Badge className="text-xs h-4 px-1.5">New</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-semibold text-sm truncate">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {msg.body.substring(0, 120)}…
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COMPOSE ── */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>Send a private message to a specific member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient</Label>
                {usersLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
                  </div>
                ) : (
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member…" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.firstName} {u.lastName} — {u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-subject">Subject</Label>
                <Input
                  id="c-subject"
                  placeholder="Message subject"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-body">Message</Label>
                <Textarea
                  id="c-body"
                  placeholder="Write your message here…"
                  rows={8}
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRecipientId(""); setComposeSubject(""); setComposeBody(""); }}>
                  Clear
                </Button>
                <Button onClick={handleSend} disabled={sendMessage.isPending} className="gap-2">
                  {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BROADCAST ── */}
        <TabsContent value="broadcast">
          <Card>
            <CardHeader>
              <CardTitle>Send Broadcast</CardTitle>
              <CardDescription>
                Announce news, promotions, or policy updates to all members or a specific group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={broadcastRole} onValueChange={setBroadcastRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="member">Members Only</SelectItem>
                    <SelectItem value="pro_member">Pro Members Only</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="b-subject">Subject / Headline</Label>
                <Input
                  id="b-subject"
                  placeholder="e.g. New Product Launch — IGNITE XL Now Available!"
                  value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="b-body">Message Body</Label>
                <Textarea
                  id="b-body"
                  placeholder="Write your announcement here…"
                  rows={8}
                  value={broadcastBody}
                  onChange={e => setBroadcastBody(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  This message will appear in the inbox of all{" "}
                  {broadcastRole === "all" ? "members" : `${broadcastRole.replace("_", " ")}s`}.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setBroadcastSubject(""); setBroadcastBody(""); setBroadcastRole("all"); }}>
                    Clear
                  </Button>
                  <Button onClick={handleBroadcast} disabled={broadcastMessage.isPending} className="gap-2">
                    {broadcastMessage.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Megaphone className="h-4 w-4" />
                    }
                    Send Broadcast
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={open => !open && setSelectedMsg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{selectedMsg?.subject}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground border-b pb-4">
              <div className="flex items-center gap-2">
                {selectedMsg?.isBroadcast
                  ? <><Megaphone className="h-4 w-4" /> <span>Broadcast to all members</span></>
                  : <span>From: <span className="font-medium text-foreground">{selectedMsg?.fromUserName}</span></span>
                }
              </div>
              <span>{selectedMsg && new Date(selectedMsg.createdAt).toLocaleString()}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{selectedMsg?.body}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
