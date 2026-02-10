export type User = {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  bio: string;
  visibility: 'open' | 'locked';
};

export type Place = {
  id: string;
  name: string;
  category: string;
  summary: string;
  rating: number;
  tags: string[];
  address: string;
  coordinates?: [number, number];
};

export type Person = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  commonTags: string[];
};

export type Review = {
  id: string;
  placeId: string;
  title: string;
  notes: string;
  rating: number;
  createdAt: string;
};
