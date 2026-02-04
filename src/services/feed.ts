import seed from '../mocks/feed.json';

export type FeedPost = {
  id: string;
  author: string;
  time: string;
  avatar: string;
  image: string;
  rating?: string;
  title: string;
  body: string;
  likes?: string;
  comments?: string;
  premium: boolean;
};

const posts = (seed as { posts: FeedPost[] }).posts;

export function getFeedPosts() {
  return posts;
}
