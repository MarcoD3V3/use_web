"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Compass, MessageCircle, Send, UserPlus, Users, X } from "lucide-react";
import type {
  PortalChatFriend,
  PortalChatMessage,
  PortalChatSnapshot,
  PortalExplorePlayer,
} from "@/lib/portal-chat-types";
import { cn, formatRelativeTime } from "@/lib/utils";

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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const friendInputRef = useRef<HTMLInputElement>(null);

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
    if (!open) return;
    setLoading(true);
    void loadChat(peer?.userId).finally(() => setLoading(false));
  }, [open, peer?.userId, loadChat]);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      void loadChat(peer?.userId);
    }, 5000);
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
      if (peer && data.chat && !data.chat.friends.some((f) => f.userId === peer.userId)) {
        setPeer(null);
      }
      setDraft("");
    } catch {
      setError("Error al enviar");
    } finally {
      setSending(false);
    }
  }

  async function addFriend(username: string, openChat = false) {
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
        friend?: PortalChatFriend;
        chat?: PortalChatSnapshot;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo añadir");
        return;
      }
      if (data.chat) setChat(data.chat);
      setFriendUsername("");
      if (openChat && data.friend) {
        setPeer(data.friend);
        setTab("friends");
      }
    } catch {
      setError("Error de red");
    } finally {
      setAddingFriend(false);
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

  const onlineCount = chat?.explore.length ?? 0;

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
                    ? "En línea en el launcher"
                    : "Historial guardado en la nube"
                  : "Amigos y jugadores activos"}
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

          {error && <p className="portal-chat-error">{error}</p>}

          <div className="portal-chat-panel__body">
            {loading && !chat ? (
              <p className="portal-chat-empty">Cargando…</p>
            ) : peer ? (
              <ConversationView messages={chat?.messages ?? []} endRef={messagesEndRef} />
            ) : tab === "friends" ? (
              <FriendsList
                friends={chat?.friends ?? []}
                onSelect={openConversation}
                onExplore={() => setTab("explore")}
                onFocusAdd={() => friendInputRef.current?.focus()}
              />
            ) : (
              <ExploreList players={chat?.explore ?? []} onAdd={addFriend} onChat={openConversation} friends={chat?.friends ?? []} />
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
                    void addFriend(friendUsername, true);
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
                onClick={() => void addFriend(friendUsername, true)}
                aria-label="Añadir amigo"
                title="Añadir amigo"
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
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  );
}

function FriendsList({
  friends,
  onSelect,
  onExplore,
  onFocusAdd,
}: {
  friends: PortalChatFriend[];
  onSelect: (f: PortalChatFriend) => void;
  onExplore: () => void;
  onFocusAdd: () => void;
}) {
  if (!friends.length) {
    return (
      <div className="portal-chat-empty portal-chat-empty--actions">
        <p>Aún no tienes amigos. Añade uno por usuario o explora jugadores con el launcher abierto.</p>
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
              <span className="text-[10px] text-portal-muted shrink-0">{formatRelativeTime(f.lastMessageAt)}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ExploreList({
  players,
  friends,
  onAdd,
  onChat,
}: {
  players: PortalExplorePlayer[];
  friends: PortalChatFriend[];
  onAdd: (username: string, openChat?: boolean) => void;
  onChat: (f: PortalChatFriend) => void;
}) {
  if (!players.length) {
    return (
      <p className="portal-chat-empty">
        Nadie con el launcher abierto ahora. Los mensajes que envíes se guardan y se ven desde cualquier PC.
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
                  {p.premium ? " · Premium" : ""}
                </p>
              </div>
            </div>
            {existing ? (
              <button
                type="button"
                className="portal-chat-mini-btn"
                onClick={() => onChat(existing)}
              >
                Chat
              </button>
            ) : (
              <button
                type="button"
                className="portal-chat-mini-btn portal-chat-mini-btn--accent"
                onClick={() => void onAdd(p.username, true)}
              >
                Añadir
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
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
          <span className="portal-chat-bubble-msg__time">{formatRelativeTime(m.createdAt)}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
