export type UUID = string;
export type ISODateString = string;

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export type VoidFunction = () => void;

export enum RoomType {
  Direct = 'direct',
  Group = 'group',
}

export enum MemberRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member',
}

export enum MessageType {
  Text = 'text',
  Image = 'image',
  File = 'file',
  System = 'system',
}

export enum ContactStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Blocked = 'blocked',
}

export enum CallType {
  Audio = 'audio',
  Video = 'video',
}

export enum CallStatus {
  Ringing = 'ringing',
  Active = 'active',
  Ended = 'ended',
  Missed = 'missed',
  Declined = 'declined',
}

export interface AuthUser {
  id: UUID;
  email: string;
  emailConfirmedAt: Nullable<ISODateString>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  display_name?: string;
}

export interface Profile {
  id: UUID;
  username: string;
  display_name: Nullable<string>;
  avatar_url: Nullable<string>;
  bio: Nullable<string>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface User {
  id: UUID;
  email: string;
  emailConfirmedAt: Nullable<ISODateString>;
  username: string;
  display_name: Nullable<string>;
  avatarUrl: Nullable<string>;
  bio: Nullable<string>;
  isOnline: boolean;
  lastSeen: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserSummary {
  id: UUID;
  username: string;
  display_name: Nullable<string>;
  avatarUrl: Nullable<string>;
  isOnline: boolean;
}

export interface ProfileWithPresence extends Profile {
  presence: Presence;
}

export type ProfileUpdate = Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'bio'>>;
export type UserUpdate = ProfileUpdate;

export interface Presence {
  userId: UUID;
  isOnline: boolean;
  lastSeen: ISODateString;
}

export interface Room {
  id: UUID;
  name: Nullable<string>;
  type: RoomType;
  createdBy: Nullable<UUID>;
  avatarUrl: Nullable<string>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface RoomWithDetails extends Room {
  members: RoomMember[];
  lastMessage: Nullable<Message>;
  unreadCount: number;
}

export interface CreateRoomPayload {
  name?: string;
  type: RoomType;
  memberIds: UUID[];
}

export interface RoomMember {
  id: UUID;
  roomId: UUID;
  userId: UUID;
  role: MemberRole;
  joinedAt: ISODateString;
  profile?: Profile;
}

export interface Message {
  id: UUID;
  roomId: UUID;
  senderId: Nullable<UUID>;
  type: MessageType;
  content: Nullable<string>;
  fileUrl: Nullable<string>;
  fileName: Nullable<string>;
  fileSize: Nullable<number>;
  replyTo: Nullable<UUID>;
  editedAt: Nullable<ISODateString>;
  deletedAt: Nullable<ISODateString>;
  createdAt: ISODateString;
}

export interface MessageWithSender extends Message {
  sender: Nullable<UserSummary>;
  replyToMessage: Nullable<Message>;
}

export interface SendMessagePayload {
  roomId: UUID;
  type: MessageType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: UUID;
}

export interface EditMessagePayload {
  messageId: UUID;
  content: string;
}

export interface MessageRead {
  userId: UUID;
  roomId: UUID;
  lastReadAt: ISODateString;
}

export interface Contact {
  id: UUID;
  userId: UUID;
  contactId: UUID;
  status: ContactStatus;
  createdAt: ISODateString;
}

export interface ContactWithProfile extends Contact {
  contact: ProfileWithPresence;
}

export interface SendContactRequestPayload {
  contactId: UUID;
}

export interface Call {
  id: UUID;
  roomId: Nullable<UUID>;
  initiatorId: Nullable<UUID>;
  type: CallType;
  status: CallStatus;
  startedAt: Nullable<ISODateString>;
  endedAt: Nullable<ISODateString>;
  createdAt: ISODateString;
}

export interface CallWithDetails extends Call {
  participants: CallParticipant[];
  initiator: Nullable<Profile>;
}

export interface CallParticipant {
  id: UUID;
  callId: UUID;
  userId: UUID;
  joinedAt: Nullable<ISODateString>;
  leftAt: Nullable<ISODateString>;
  profile?: Profile;
}

export interface StartCallPayload {
  roomId: UUID;
  type: CallType;
  participantIds: UUID[];
}

export interface PeerConnectionState {
  peerId: UUID;
  connection: RTCPeerConnection;
  stream: Nullable<MediaStream>;
  isAudioMuted: boolean;
  isVideoOff: boolean;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'hang-up';
  callId: UUID;
  senderId: UUID;
  targetId: UUID;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

export interface MediaStreamConstraints {
  audio: boolean;
  video: boolean | MediaTrackConstraints;
}

export interface ICEServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface AuthState {
  user: Nullable<User>;
  session: Nullable<Session>;
  isLoading: boolean;
  error: Nullable<string>;
}

export interface ChatState {
  activeRoomId: Nullable<UUID>;
  rooms: Record<UUID, RoomWithDetails>;
  messages: Record<UUID, MessageWithSender[]>;
  typingUsers: Record<UUID, UUID[]>;
  isLoadingMessages: boolean;
}

export interface CallState {
  activeCall: Nullable<Call>;
  incomingCall: Nullable<CallWithDetails>;
  peers: Record<UUID, PeerConnectionState>;
  localStream: Nullable<MediaStream>;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export interface UIState {
  isSidebarOpen: boolean;
  activeModal: Nullable<ModalType>;
  theme: 'light' | 'dark' | 'system';
}

export interface PresenceState {
  onlineUsers: Record<UUID, Presence>;
}

export type ModalType =
  | 'call-invite'
  | 'create-room'
  | 'edit-profile'
  | 'add-contact'
  | 'file-preview'
  | 'confirm-delete';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface TypingUser {
  userId: string;
  username: string;
  displayName: string;
  startedAt: number;
  isTyping: boolean;
}

export interface StreamingState {
  isConnected: boolean;
  isTyping: boolean;
  typingUsers: TypingUser[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

export interface SettingsNav {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGAttributes<SVGSVGElement>>;
}

export interface SettingsFormData {
  fullName: string;
  email: string;
  bio: string;
  avatar: string | File;
}

export interface FormField {
  field: string;
  label: string;
  type: string;
  icon: React.ComponentType<React.SVGAttributes<SVGSVGElement>>;
  placeholder: string;
  readOnly?: boolean;
}

export interface AccountInfo {
  icon: React.ComponentType<React.SVGAttributes<SVGSVGElement>>;
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  verified?: boolean;
}

export type AuthMode = 'signin' | 'signup';

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}