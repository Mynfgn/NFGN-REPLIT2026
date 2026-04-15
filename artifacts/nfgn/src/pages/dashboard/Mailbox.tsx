import { useState } from "react";
import { useListMessages, useMarkMessageRead, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Mail, Megaphone, PenSquare, Send, Inbox, MailOpen, AlertCircle, X } from "lucide-react";
import { customFetch } from "@/lib/custom-fetch";

export function MailboxPage() {
  const { data: me } = useGetMe();
  const { data, isLoading, refetch } = useListMessages({ page: 1, limit: 100 });
  const markRead = useMarkMessageRead();

  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  const messages = data?.messages ?? [];
  const unread = data?.unreadCount ?? 0;

  const inbox = messages.filter((m: any) => m.toUserId === me?.id && !m.isBroadcast);
  const broadcasts = messages.filter((m: any) => m.isBroadcast);
  const sent = messages.filter((m: any) => m.fromUserId === me?.id && !m.isBroadcast);

  function openMessage(msg: any) {
    setSelectedMsg(msg);
    if (!msg.isRead && msg.toUserId === me?.id) {
      markRead.mutate({ id: msg.id }, { onSuccess: () => refetch() });
    }
  }

  async function handleSend() {
    setSendError("");
    if (!composeTo.trim()) { setSendError("Recipient email or user ID is required."); return; }
    if (!composeSubject.trim()) { setSendError("Subject is required."); return; }
    if (!composeBody.trim()) { setSendError("Message body is required."); return; }

    setSending(true);
    try {
      const res = await customFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: isNaN(Number(composeTo)) ? undefined : Number(composeTo),
          subject: composeSubject,
          body: composeBody,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSendError(err.error ?? "Failed to send message.");
      } else {
        setSendSuccess(true);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        refetch();
        setTimeout(() => { setSendSuccess(false); setComposeOpen(false); }, 1500);
      }
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function MessageList({ msgs, emptyMsg }: { msgs: any[]; emptyMsg: string }) {
    if (msgs.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>{emptyMsg}</p>
        </div>
      );
    }
    return (
      <div className="divide-y">
        {msgs.map((msg: any) => {
          const isUnread = !msg.isRead && msg.toUserId === me?.id;
          return (
            <div
              key={msg.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${isUnread ? "bg-primary/4" : ""}`}
              onClick={() => openMessage(msg)}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isBroadcast ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {msg.isBroadcast ? <Megaphone className="h-4 w-4" /> : isUnread ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isUnread ? "font-bold" : "font-medium"}`}>{msg.fromUserName}</span>
                      {isUnread && <Badge className="text-xs h-4 px-1.5">New</Badge>}
                      {msg.isBroadcast && <Badge variant="outline" className="text-xs h-4 px-1.5 text-primary border-primary/30">Broadcast</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-sm mt-0.5 truncate ${isUnread ? "font-medium" : ""}`}>{msg.subject}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body.substring(0, 90)}{msg.body.length > 90 ? "…" : ""}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif font-bold">Mailbox</h1>
          <p className="text-muted-foreground">
            {unread > 0 ? `${unread} unread message${unread > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="gap-2">
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">
            <Inbox className="h-3.5 w-3.5 mr-1.5" />
            Inbox
            {inbox.filter((m: any) => !m.isRead).length > 0 && (
              <Badge className="ml-2 text-xs h-4 px-1.5">{inbox.filter((m: any) => !m.isRead).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcasts">
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            Broadcasts
            {broadcasts.filter((m: any) => !m.isRead).length > 0 && (
              <Badge className="ml-2 text-xs h-4 px-1.5">{broadcasts.filter((m: any) => !m.isRead).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <MessageList msgs={inbox} emptyMsg="No messages in your inbox yet." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                Announcements from the NFGN team
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <MessageList msgs={broadcasts} emptyMsg="No announcements yet." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <MessageList msgs={sent} emptyMsg="You haven't sent any messages yet." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={(open) => !open && setSelectedMsg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif pr-6">{selectedMsg?.subject}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground border-b pb-4">
              <div className="space-y-0.5">
                <span>From: <span className="font-medium text-foreground">{selectedMsg?.fromUserName}</span></span>
                {selectedMsg?.isBroadcast && <Badge variant="outline" className="ml-2 text-xs text-primary border-primary/30">Broadcast</Badge>}
              </div>
              <span className="text-right">{selectedMsg && new Date(selectedMsg.createdAt).toLocaleString()}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap text-sm">{selectedMsg?.body}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <PenSquare className="h-5 w-5 text-primary" />
              New Message
            </DialogTitle>
          </DialogHeader>
          {sendSuccess ? (
            <div className="flex flex-col items-center py-8 gap-3 text-green-600">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Send className="h-6 w-6" />
              </div>
              <p className="font-semibold">Message sent!</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>To (User ID)</Label>
                <Input
                  placeholder="Enter recipient user ID"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">You can find a member's user ID in the Genealogy tab.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  placeholder="Message subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea
                  placeholder="Write your message here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={5}
                />
              </div>
              {sendError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {sendError}
                </div>
              )}
            </div>
          )}
          {!sendSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending} className="gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
