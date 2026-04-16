import { useState } from "react";
import { useListMessages, useMarkMessageRead, useGetMe, useGetDownline } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, Mail, Megaphone, PenSquare, Send, Inbox, MailOpen,
  AlertCircle, HeartHandshake, Users, UserCircle, Phone, ExternalLink,
} from "lucide-react";
import { customFetch } from "@/lib/custom-fetch";

const ADMIN_USER_ID = 1;
const CONTACT_EMAIL = "newfaceglobalnetwork@gmail.com";
const CONTACT_PHONE = "(678) 909-9974";

type ComposePreset = {
  toUserId?: number;
  subject?: string;
  body?: string;
  toLabel?: string;
};

export function MailboxPage() {
  const { data: me } = useGetMe();
  const { data: msgs, isLoading, refetch } = useListMessages({ page: 1, limit: 100 });
  const { data: downline, isLoading: loadingTeam } = useGetDownline({ generation: 1 } as any);
  const markRead = useMarkMessageRead();

  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeToLabel, setComposeToLabel] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  const messages = msgs?.messages ?? [];
  const unread = msgs?.unreadCount ?? 0;

  const inbox = messages.filter((m: any) => m.toUserId === me?.id && !m.isBroadcast);
  const broadcasts = messages.filter((m: any) => m.isBroadcast);
  const sent = messages.filter((m: any) => m.fromUserId === me?.id && !m.isBroadcast);

  const teamMembers: any[] = Array.isArray(downline) ? downline : [];
  const directTeam = teamMembers.filter((m: any) => m.generation === (me ? (me as any).generation + 1 : undefined) || true).slice(0, 50);

  function openCompose(preset: ComposePreset = {}) {
    setComposeTo(preset.toUserId !== undefined ? String(preset.toUserId) : "");
    setComposeToLabel(preset.toLabel ?? "");
    setComposeSubject(preset.subject ?? "");
    setComposeBody(preset.body ?? "");
    setSendError("");
    setSendSuccess(false);
    setComposeOpen(true);
  }

  function openMessage(msg: any) {
    setSelectedMsg(msg);
    if (!msg.isRead && msg.toUserId === me?.id) {
      markRead.mutate({ id: msg.id }, { onSuccess: () => refetch() });
    }
  }

  async function handleSend() {
    setSendError("");
    if (!composeTo.trim()) { setSendError("Recipient is required."); return; }
    if (!composeSubject.trim()) { setSendError("Subject is required."); return; }
    if (!composeBody.trim()) { setSendError("Message body is required."); return; }

    setSending(true);
    try {
      const toId = Number(composeTo);
      const res = await customFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: !isNaN(toId) ? toId : undefined,
          subject: composeSubject,
          body: composeBody,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSendError(err.error ?? "Failed to send message.");
      } else {
        setSendSuccess(true);
        refetch();
        setTimeout(() => { setSendSuccess(false); setComposeOpen(false); }, 1500);
      }
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function MessageList({ list, emptyMsg }: { list: any[]; emptyMsg: string }) {
    if (list.length === 0) {
      return (
        <div className="text-center py-14 text-muted-foreground">
          <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>{emptyMsg}</p>
        </div>
      );
    }
    return (
      <div className="divide-y">
        {list.map((msg: any) => {
          const isUnread = !msg.isRead && msg.toUserId === me?.id;
          return (
            <div
              key={msg.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${isUnread ? "bg-primary/5" : ""}`}
              onClick={() => openMessage(msg)}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isBroadcast ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {msg.isBroadcast ? <Megaphone className="h-4 w-4" /> : isUnread ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif font-bold">Mailbox</h1>
          <p className="text-muted-foreground">
            {unread > 0 ? `${unread} unread message${unread > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <Button onClick={() => openCompose()} className="gap-2">
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          className="cursor-pointer hover:border-primary/40 transition-colors group"
          onClick={() => openCompose({
            toUserId: ADMIN_USER_ID,
            toLabel: "NFGN Support",
            subject: "Contact Us Inquiry",
            body: `Hello NFGN Support,\n\nMy name is ${me?.firstName} ${me?.lastName} and I would like to inquire about:\n\n`,
          })}
        >
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Contact Us</p>
              <p className="text-xs text-muted-foreground">Send a message to NFGN support</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`transition-colors ${me?.sponsorId ? "cursor-pointer hover:border-primary/40 group" : "opacity-60"}`}
          onClick={() => {
            if (!me?.sponsorId) return;
            openCompose({
              toUserId: me.sponsorId,
              toLabel: "My Sponsor",
              subject: "Message from your downline",
              body: `Hi,\n\nThis is ${me?.firstName} ${me?.lastName} from your team.\n\n`,
            });
          }}
        >
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">My Sponsor</p>
              <p className="text-xs text-muted-foreground">
                {me?.sponsorId ? "Message your sponsor directly" : "No sponsor linked"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/40 transition-colors group"
          onClick={() => openCompose({
            subject: "Team Announcement",
            body: `Hi team,\n\nThis is ${me?.firstName} ${me?.lastName}. I wanted to share:\n\n`,
          })}
        >
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">My Team</p>
              <p className="text-xs text-muted-foreground">Compose a message to a member</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inbox">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="inbox">
            <Inbox className="h-3.5 w-3.5 mr-1.5" />
            Inbox
            {inbox.filter((m: any) => !m.isRead).length > 0 && (
              <Badge className="ml-1.5 text-xs h-4 px-1.5">{inbox.filter((m: any) => !m.isRead).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcasts">
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            Broadcasts
            {broadcasts.filter((m: any) => !m.isRead).length > 0 && (
              <Badge className="ml-1.5 text-xs h-4 px-1.5">{broadcasts.filter((m: any) => !m.isRead).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            My Team Members
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
                <MessageList list={inbox} emptyMsg="No messages in your inbox yet." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                Official announcements from the NFGN team
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <MessageList list={broadcasts} emptyMsg="No announcements yet." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                My Team Members
              </CardTitle>
              <CardDescription>Your direct downline — click "Message" to open the compose dialog</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeam ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : directTeam.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No team members yet</p>
                  <p className="text-sm mt-1">Share your referral link to start building your team!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {directTeam.map((member: any) => (
                    <div key={member.userId ?? member.id} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{member.email}</span>
                            {member.isProMember && (
                              <Badge variant="outline" className="text-xs h-4 px-1.5 text-primary border-primary/30">Pro</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 flex-shrink-0"
                        onClick={() => openCompose({
                          toUserId: member.userId ?? member.id,
                          toLabel: `${member.firstName} ${member.lastName}`,
                          subject: "Message from your sponsor",
                          body: `Hi ${member.firstName},\n\n`,
                        })}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Message
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact NFGN Support Card */}
          <Card className="mt-4 bg-primary/5 border-primary/20">
            <CardContent className="pt-5 pb-4">
              <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-primary" />
                Need to reach NFGN directly?
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <a href="mailto:newfaceglobalnetwork@gmail.com" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Mail className="h-3.5 w-3.5" />
                  {CONTACT_EMAIL}
                </a>
                <a href="tel:+16789099974" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Phone className="h-3.5 w-3.5" />
                  {CONTACT_PHONE}
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openCompose({
                    toUserId: ADMIN_USER_ID,
                    toLabel: "NFGN Support",
                    subject: "Contact Us Inquiry",
                    body: `Hello NFGN Support,\n\nMy name is ${me?.firstName} ${me?.lastName}.\n\n`,
                  })}
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  Send In-App Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <MessageList list={sent} emptyMsg="You haven't sent any messages yet." />
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
              <div className="flex items-center gap-2 flex-wrap">
                <span>From: <span className="font-medium text-foreground">{selectedMsg?.fromUserName}</span></span>
                {selectedMsg?.isBroadcast && <Badge variant="outline" className="text-xs text-primary border-primary/30">Broadcast</Badge>}
              </div>
              <span className="text-right text-xs">{selectedMsg && new Date(selectedMsg.createdAt).toLocaleString()}</span>
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
              {composeToLabel ? `Message ${composeToLabel}` : "New Message"}
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
                <Label>To {composeToLabel && <span className="text-primary font-medium">— {composeToLabel}</span>}</Label>
                <Input
                  placeholder="Enter recipient user ID"
                  value={composeTo}
                  onChange={(e) => { setComposeTo(e.target.value); setComposeToLabel(""); }}
                />
                <p className="text-xs text-muted-foreground">Use a member's user ID. Find IDs in the Genealogy tab or My Team tab above.</p>
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
