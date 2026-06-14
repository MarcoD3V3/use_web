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
};

export type PortalChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type PortalChatSnapshot = {
  friends: PortalChatFriend[];
  explore: PortalExplorePlayer[];
  messages: PortalChatMessage[];
  peerUserId: string | null;
};
