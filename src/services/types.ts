export type User = {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
};

export type Place = {
  id: string;
  name: string;
  category: string;
  summary: string;
  rating: number;
  tags: string[];
  address: string;
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
