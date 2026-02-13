import { toFeedPost } from '../reviewViewModels';

describe('reviewViewModels', () => {
  it('maps like/comment counts into feed post', () => {
    const post = toFeedPost(
      {
        id: 'review-1',
        placeId: 'place-1',
        placeTitle: 'Blue Bottle',
        placeCoordinates: null,
        title: 'Blue Bottle',
        notes: 'Great coffee',
        rating: 9,
        visibility: 'followers',
        userId: 'user-1',
        userName: 'Alex',
        userHandle: 'alex',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: '2026-02-13T10:00:00.000Z',
        updatedAt: '2026-02-13T10:00:00.000Z',
      },
      {
        likeCount: 12,
        commentCount: 3,
      }
    );

    expect(post.likes).toBe('12');
    expect(post.comments).toBe('3');
  });
});
