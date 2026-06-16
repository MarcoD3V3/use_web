"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Compass,
  MessageCircle,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type {
  PortalChatFriend,
  PortalChatMessage,
  PortalChatSnapshot,
  PortalExplorePlayer,
  PortalFriendRequest,
} from "@/lib/portal-chat-types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { MessageLinkText } from "@/components/portal/MessageLinkText";

type Tab = "friends" | "explore";

export function PortalChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("friends");
  const [chat, setChat] = useState<PortalChatSnapshot | null>(null);
  const [peer, setPeer] = useState<PortalChatFriend | null>(null);
  const [draft, setDraft] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const friendInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const loadChat = useCallback(async (peerId?: string) => {
    try {
      const url = peerId ? `/api/portal/chat?peer=${encodeURIComponent(peerId)}` : "/api/portal/chat";
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as { ok?: boolean; chat?: PortalChatSnapshot; error?: string };
      if (!res.ok || !data.chat) {
        setError(data.error ?? "No se pudo cargar el chat");
        return;
      }
      setChat(data.chat);
      if (peerId && !data.chat.friends.some((f) => f.userId === peerId)) {
        setPeer(null);
        setDraft("");
      }
      setError(null);
    } catch {
      setError("Error de red");
    }
  }, []);

  useEffect(() => {
    const ping = () => void loadChat(peer?.userId);
    ping();
    const timer = setInterval(ping, 25000);
    return () => clearInterval(timer);
  }, [loadChat, peer?.userId]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void loadChat(peer?.userId).finally(() => setLoading(false));
  }, [open, peer?.userId, loadChat]);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => void loadChat(peer?.userId), 5000);
    return () => clearInterval(timer);
  }, [open, peer?.userId, loadChat]);

  useEffect(() => {
    if (peer && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: "end" });
    }
  }, [chat?.messages, peer]);

  async function sendMessage() {
    if (!peer || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          recipientUserId: peer.userId,
          text: draft,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; chat?: PortalChatSnapshot; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo enviar");
        return;
      }
      if (data.chat) setChat(data.chat);
      setDraft("");
    } catch {
      setError("Error al enviar");
    } finally {
      setSending(false);
    }
  }

  async function sendFriendRequest(username: string, openChat = false) {
    const normalized = username.trim();
    if (!normalized) return;
    setAddingFriend(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_friend", username: normalized }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        type?: "accepted" | "request_sent";
        friend?: PortalChatFriend;
        chat?: PortalChatSnapshot;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo enviar la solicitud");
        return;
      }
      if (data.chat) setChat(data.chat);
      setFriendUsername("");
      if (data.type === "accepted" && data.friend) {
        showToast(`${data.friend.displayName} aceptó tu solicitud`);
        if (openChat) {
          setPeer(data.friend);
          setTab("friends");
        }
      } else {
        showToast(`Solicitud enviada a @${normalized}`);
      }
    } catch {
      setError("Error de red");
    } finally {
      setAddingFriend(false);
    }
  }

  async function acceptRequest(req: PortalFriendRequest) {
    setRequestActionId(req.id);
    setError(null);
    try {
      const res = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept_friend", requestId: req.id, fromUserId: req.userId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        friend?: PortalChatFriend;
        chat?: PortalChatSnapshot;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo aceptar");
        return;
      }
      if (data.chat) setChat(data.chat);
      if (data.friend) {
        showToast(`Ahora eres amigo de ${data.friend.displayName}`);
        setPeer(data.friend);
      }
    } catch {
      setError("Error de red");
    } finally {
      setRequestActionId(null);
    }
  }

  async function declineRequest(req: PortalFriendRequest) {
    setRequestActionId(req.id);
    setError(null);
    try {
      const res = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline_friend", requestId: req.id, fromUserId: req.userId }),
      });
      const data = (await res.json()) as { ok?: boolean; chat?: PortalChatSnapshot; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo rechazar");
        return;
      }
      if (data.chat) setChat(data.chat);
    } catch {
      setError("Error de red");
    } finally {
      setRequestActionId(null);
    }
  }

  function openConversation(friend: PortalChatFriend) {
    setPeer(friend);
    setTab("friends");
  }

  function closeConversation() {
    setPeer(null);
    void loadChat();
  }

  const incoming = chat?.requests.filter((r) => r.direction === "incoming") ?? [];
  const outgoing = chat?.requests.filter((r) => r.direction === "outgoing") ?? [];
  const onlineCount = chat?.explore.length ?? 0;
  const incomingCount = chat?.incomingRequestCount ?? 0;

  return (
    <div className="portal-chat-root">
      {open && (
        <div className="portal-chat-panel">
          <header className="portal-chat-panel__header">
            {peer ? (
              <button type="button" className="portal-chat-icon-btn" onClick={closeConversation} aria-label="Volver">
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <MessageCircle className="w-4 h-4 text-portal-accent-soft" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {peer ? peer.displayName : "Mensajes"}
              </p>
              <p className="text-[10px] text-portal-muted truncate">
                {peer
                  ? peer.online
                    ? "En línea"
                    : "Historial guardado en la nube"
                  : "Amigos, solicitudes y jugadores activos"}
              </p>
            </div>
            <button type="button" className="portal-chat-icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </header>

          {!peer && (
            <div className="portal-chat-tabs">
              <button
                type="button"
                className={cn("portal-chat-tab", tab === "friends" && "portal-chat-tab--active")}
                onClick={() => setTab("friends")}
              >
                <Users className="w-3.5 h-3.5" />
                Amigos
                {incomingCount > 0 && <span className="portal-chat-tab__badge">{incomingCount}</span>}
              </button>
              <button
                type="button"
                className={cn("portal-chat-tab", tab === "explore" && "portal-chat-tab--active")}
                onClick={() => setTab("explore")}
              >
                <Compass className="w-3.5 h-3.5" />
                Explorar
                {onlineCount > 0 && <span className="portal-chat-tab__badge">{onlineCount}</span>}
              </button>
            </div>
          )}

          {toast && <p className="portal-chat-toast">{toast}</p>}
          {error && <p className="portal-chat-error">{error}</p>}

          <div className="portal-chat-panel__body">
            {loading && !chat ? (
              <p className="portal-chat-empty">Cargando…</p>
            ) : peer ? (
              <ConversationView messages={chat?.messages ?? []} endRef={messagesEndRef} />
            ) : tab === "friends" ? (
              <FriendsView
                friends={chat?.friends ?? []}
                incoming={incoming}
                outgoing={outgoing}
                requestActionId={requestActionId}
                onSelect={openConversation}
                onExplore={() => setTab("explore")}
                onFocusAdd={() => friendInputRef.current?.focus()}
                onAccept={acceptRequest}
                onDecline={declineRequest}
              />
            ) : (
              <ExploreList
                players={chat?.explore ?? []}
                friends={chat?.friends ?? []}
                onRequest={sendFriendRequest}
                onChat={openConversation}
              />
            )}
          </div>

          {peer && (
            <footer className="portal-chat-compose">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Escribe un mensaje…"
                className="portal-chat-compose__input"
                maxLength={2000}
              />
              <button
                type="button"
                className="portal-chat-compose__send"
                disabled={sending || !draft.trim()}
                onClick={() => void sendMessage()}
                aria-label="Enviar"
              >
                <Send className="w-4 h-4" />
              </button>
            </footer>
          )}

          {!peer && tab === "friends" && (
            <footer className="portal-chat-compose">
              <input
                ref={friendInputRef}
                type="text"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void sendFriendRequest(friendUsername);
                  }
                }}
                placeholder="Usuario del jugador…"
                className="portal-chat-compose__input"
                maxLength={32}
                autoComplete="off"
              />
              <button
                type="button"
                className="portal-chat-compose__send portal-chat-compose__send--add"
                disabled={addingFriend || !friendUsername.trim()}
                onClick={() => void sendFriendRequest(friendUsername)}
                aria-label="Enviar solicitud"
                title="Enviar solicitud de amistad"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </footer>
          )}
        </div>
      )}

      <button
        type="button"
        className={cn("portal-chat-bubble", open && "portal-chat-bubble--open")}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            {incomingCount > 0 && <span className="portal-chat-bubble__badge">{incomingCount}</span>}
          </>
        )}
      </button>
    </div>
  );
}

function FriendsView({
  friends,
  incoming,
  outgoing,
  requestActionId,
  onSelect,
  onExplore,
  onFocusAdd,
  onAccept,
  onDecline,
}: {
  friends: PortalChatFriend[];
  incoming: PortalFriendRequest[];
  outgoing: PortalFriendRequest[];
  requestActionId: string | null;
  onSelect: (f: PortalChatFriend) => void;
  onExplore: () => void;
  onFocusAdd: () => void;
  onAccept: (r: PortalFriendRequest) => void;
  onDecline: (r: PortalFriendRequest) => void;
}) {
  if (!friends.length && !incoming.length && !outgoing.length) {
    return (
      <div className="portal-chat-empty portal-chat-empty--actions">
        <p>Envía una solicitud por usuario o explora quién está en el portal o launcher ahora.</p>
        <div className="portal-chat-empty__actions">
          <button type="button" className="portal-chat-action-btn portal-chat-action-btn--primary" onClick={onFocusAdd}>
            <UserPlus className="w-3.5 h-3.5" />
            Añadir amigo
          </button>
          <button type="button" className="portal-chat-action-btn" onClick={onExplore}>
            <Compass className="w-3.5 h-3.5" />
            Explorar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-chat-sections">
      {incoming.length > 0 && (
        <section>
          <p className="portal-chat-section-title">Solicitudes recibidas</p>
          <ul className="portal-chat-list">
            {incoming.map((r) => (
              <li key={r.id} className="portal-chat-request-item">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{r.displayName}</p>
                  <p className="text-[11px] text-portal-muted truncate">@{r.username}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    className="portal-chat-mini-btn portal-chat-mini-btn--accent"
                    disabled={requestActionId === r.id}
                    onClick={() => void onAccept(r)}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    className="portal-chat-mini-btn"
                    disabled={requestActionId === r.id}
                    onClick={() => void onDecline(r)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <p className="portal-chat-section-title">Pendientes de aceptar</p>
          <ul className="portal-chat-list">
            {outgoing.map((r) => (
              <li key={r.id} className="portal-chat-request-item portal-chat-request-item--outgoing">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{r.displayName}</p>
                  <p className="text-[11px] text-portal-muted">Esperando respuesta…</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {friends.length > 0 && (
        <section>
          {incoming.length > 0 || outgoing.length > 0 ? (
            <p className="portal-chat-section-title">Amigos</p>
          ) : null}
          <ul className="portal-chat-list">
            {friends.map((f) => (
              <li key={f.userId}>
                <button type="button" className="portal-chat-list__item" onClick={() => onSelect(f)}>
                  <span className={cn("portal-chat-dot", f.online && "portal-chat-dot--online")} />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">{f.displayName}</p>
                    <p className="text-[11px] text-portal-muted truncate">
                      {f.lastMessage ?? `@${f.username}`}
                    </p>
                  </div>
                  {f.lastMessageAt && (
                    <span className="text-[10px] text-portal-muted shrink-0">
                      {formatRelativeTime(f.lastMessageAt)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ExploreList({
  players,
  friends,
  onRequest,
  onChat,
}: {
  players: PortalExplorePlayer[];
  friends: PortalChatFriend[];
  onRequest: (username: string, openChat?: boolean) => void;
  onChat: (f: PortalChatFriend) => void;
}) {
  if (!players.length) {
    return (
      <p className="portal-chat-empty">
        Nadie activo ahora. Abre el portal o el launcher en otra cuenta — aparecerás aquí en unos segundos.
      </p>
    );
  }

  return (
    <ul className="portal-chat-list">
      {players.map((p) => {
        const existing = friends.find((f) => f.userId === p.userId);
        return (
          <li key={p.userId} className="portal-chat-explore-item">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="portal-chat-dot portal-chat-dot--online" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.displayName}</p>
                <p className="text-[11px] text-portal-muted truncate">
                  @{p.username} · {p.status}
                  {p.client === "portal" ? " · Portal" : " · Launcher"}
                  {p.premium ? " · Premium" : ""}
                </p>
              </div>
            </div>
            {existing ? (
              <button type="button" className="portal-chat-mini-btn" onClick={() => onChat(existing)}>
                Chat
              </button>
            ) : p.pendingRequest ? (
              <span className="portal-chat-pending-label">Pendiente</span>
            ) : (
              <button
                type="button"
                className="portal-chat-mini-btn portal-chat-mini-btn--accent"
                onClick={() => void onRequest(p.username)}
              >
                Solicitar
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ConversationView({
  messages,
  endRef,
}: {
  messages: PortalChatMessage[];
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!messages.length) {
    return <p className="portal-chat-empty">Empieza la conversación. Los mensajes se guardan en el servidor.</p>;
  }

  return (
    <div className="portal-chat-messages">
      {messages.map((m) => (
        <div key={m.id} className={cn("portal-chat-bubble-msg", m.mine && "portal-chat-bubble-msg--mine")}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            <MessageLinkText text={m.body} />
          </p>
          <span className="portal-chat-bubble-msg__time">{formatRelativeTime(m.createdAt)}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
