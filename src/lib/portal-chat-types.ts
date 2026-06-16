export type PortalChatFriend = {
  userId: string;
  username: string;
  displayName: string;
  online: boolean;
  lastSeenAt?: string;
  lastMessage?: string;
  lastMessageAt?: string;
};

export type PortalExplorePlayer = {
  userId: string;
  username: string;
  displayName: string;
  premium: boolean;
  status: string;
  lastSeenAt: string;
  isFriend: boolean;
  client: "portal" | "launcher";
  pendingRequest?: boolean;
};

export type PortalChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type PortalFriendRequest = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
};

export type PortalChatSnapshot = {
  friends: PortalChatFriend[];
  explore: PortalExplorePlayer[];
  requests: PortalFriendRequest[];
  messages: PortalChatMessage[];
  peerUserId: string | null;
  incomingRequestCount: number;
};
