import { getFeedPosts } from '../feed';

describe('feed service', () => {
  it('returns feed posts', () => {
    const posts = getFeedPosts();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toHaveProperty('author');
    expect(posts[0]).toHaveProperty('image');
  });
});
