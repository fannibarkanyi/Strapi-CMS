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

export interface Club {
  documentId: string;
  title: string | null;
  date: string | null;
  publishedAt: string | null;
  body: Block[] | null;
  cover_image: { url: string } | null;
  owner: { username: string; email: string } | null;
}

export interface Article {
  documentId: string;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  category: { name: string } | null;
  author: { name: string } | null;
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
}
