export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUB_ADMIN' | 'MEMBER';
  position: string | null;
  phone?: string | null;
  profileImage: string | null;
  department: Department | null;
  team: Team | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface Department {
  id: string;
  name: string;
  parentId: string | null;
  children?: Department[];
  teams?: Team[];
  _count?: { users: number };
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
}

export interface RecurrenceConfig {
  type: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
}

export type AgendaCategory = 'AGENDA' | 'SCHEDULE';

export interface Agenda {
  id: string;
  category: AgendaCategory;
  title: string;
  type: AgendaType;
  description: string | null;
  startAt: string;
  endAt: string | null;
  deadline: string | null;
  recurrence: RecurrenceConfig;
  priority: Priority;
  visibility: Visibility;
  location: string | null;
  onlineLink: string | null;
  reportMethod: string | null;
  isCompleted: boolean;
  isNotice: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  participants: AgendaParticipant[];
  attachments: Attachment[];
  comments?: Comment[];
  _count?: { comments: number; attachments: number };
  recurrenceParentId?: string | null;
}

export type AgendaType = 'MEETING' | 'MEETUP' | 'TASK' | 'DEADLINE' | 'TRIP' | 'OTHER';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type Visibility = 'PRIVATE' | 'TEAM' | 'DEPARTMENT' | 'PUBLIC';
export type ParticipantRole = 'ORGANIZER' | 'PARTICIPANT' | 'REVIEWER' | 'OBSERVER';

export interface AgendaParticipant {
  id: string;
  role: ParticipantRole;
  confirmedAt?: string | null;
  user: User;
}

export interface Attachment {
  id: string;
  filename: string;
  bucketPath: string;
  size: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

export type ExtensionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DeadlineExtensionRequest {
  id: string;
  newDeadline: string;
  reason: string | null;
  status: ExtensionRequestStatus;
  reviewComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  agendaId: string;
  requestedById: string;
  requestedBy: Pick<User, 'id' | 'name' | 'profileImage' | 'position'>;
  reviewedById: string | null;
  reviewedBy: Pick<User, 'id' | 'name'> | null;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  agendaId: string | null;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}
