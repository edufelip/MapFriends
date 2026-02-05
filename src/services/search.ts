import seed from '../mocks/search.json';

export type SearchPerson = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isPro?: boolean;
  isFollowing?: boolean;
};

export type SearchPlace = {
  id: string;
  name: string;
  category: string;
  location: string;
  image: string;
  isPremium?: boolean;
};

type SearchSeed = {
  people: {
    recent: SearchPerson[];
    trending: SearchPerson[];
  };
  places: {
    recent: SearchPlace[];
    trending: SearchPlace[];
  };
};

const data = seed as SearchSeed;

export function getRecentPeople() {
  return data.people.recent;
}

export function getTrendingPeople() {
  return data.people.trending;
}

export function getRecentPlaces() {
  return data.places.recent;
}

export function getTrendingPlaces() {
  return data.places.trending;
}
