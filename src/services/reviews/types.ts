export type ReviewVisibility = 'followers' | 'subscribers';

export type ReviewAuthor = {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
};

export type ReviewPhoto = {
  path: string;
  url: string;
};

export type ReviewPhotoDraft = {
  uri: string;
  storagePath?: string;
};

export type ReviewPlace = {
  id: string;
  title: string;
  coordinates?: [number, number] | null;
};

export type ReviewRecord = {
  id: string;
  placeId: string;
  placeTitle: string;
  placeCoordinates: [number, number] | null;
  title: string;
  notes: string;
  rating: number;
  visibility: ReviewVisibility;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string | null;
  photos: ReviewPhoto[];
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateReviewInput = {
  author: ReviewAuthor;
  place: ReviewPlace;
  notes: string;
  rating: number;
  visibility: ReviewVisibility;
  photos: ReviewPhotoDraft[];
};

export type UpdateReviewInput = CreateReviewInput & {
  reviewId: string;
};
