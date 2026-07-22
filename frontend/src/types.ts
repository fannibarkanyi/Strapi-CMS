export interface BlockChild {
  type: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  children?: BlockChild[];
}

export interface Block {
  type: string;
  level?: number;
  format?: string;
  image?: { url: string; alternativeText?: string };
  children: BlockChild[];
}

export interface Location {
  documentId: string;
  address: string | null;
  building: string | null;
  room_number: string | null;
  seats: number | null;
  monitors: number | null;
  tables: number | null;
}

export type ReviewStatus = 'Sent' | 'Approved' | 'Declined';

export interface CurrentUser {
  documentId: string;
  username: string;
  email: string;
  role: { name: string; type: string };
}

export interface Tag {
  documentId: string;
  name: string | null;
}

export interface Club {
  documentId: string;
  title: string | null;
  date: string | null;
  publishedAt: string | null;
  body: Block[] | null;
  cover_image: { url: string } | null;
  owner: { username: string; email: string } | null;
  time: string | null;
  location: Location | null;
  review_status: ReviewStatus;
  tags: Tag[] | null;
}

export interface Article {
  documentId: string;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  body: Block[] | null;
  cover: { url: string } | null;
  author: { username: string; email: string } | null;
  review_status: ReviewStatus;
  tags: Tag[] | null;
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
}

export interface EventSchedule {
  start_datetime: string | null;
  end_datetime: string | null;
  timezone: string | null;
}

export interface Event {
  documentId: string;
  name: string | null;
  publishedAt: string | null;
  body: Block[] | null;
  cover_image: { url: string } | null;
  location: Location | null;
  capacity: number | null;
  registered_count: number | null;
  schedule: EventSchedule | null;
  is_public: boolean;
  tags: Tag[] | null;
  event_managers: { username: string; email: string }[] | null;
  review_status: ReviewStatus;
  submitted_by: { documentId: string; username: string; email: string } | null;
}
