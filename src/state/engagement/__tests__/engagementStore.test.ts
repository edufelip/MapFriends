import {
  createReviewComment,
  deleteReviewComment,
  getLikeState,
  listReviewComments,
  setReviewLiked,
} from '../../../services/engagement';
import { useEngagementStore } from '../engagementStore';

jest.mock('../../../services/engagement', () => ({
  getLikeState: jest.fn(),
  setReviewLiked: jest.fn(),
  listReviewComments: jest.fn(),
  createReviewComment: jest.fn(),
  deleteReviewComment: jest.fn(),
}));

const mockGetLikeState = getLikeState as jest.MockedFunction<typeof getLikeState>;
const mockSetReviewLiked = setReviewLiked as jest.MockedFunction<typeof setReviewLiked>;
const mockListReviewComments = listReviewComments as jest.MockedFunction<typeof listReviewComments>;
const mockCreateReviewComment = createReviewComment as jest.MockedFunction<typeof createReviewComment>;
const mockDeleteReviewComment = deleteReviewComment as jest.MockedFunction<typeof deleteReviewComment>;

describe('engagementStore', () => {
  beforeEach(() => {
    useEngagementStore.getState().clearEngagement();
    mockGetLikeState.mockReset();
    mockSetReviewLiked.mockReset();
    mockListReviewComments.mockReset();
    mockCreateReviewComment.mockReset();
    mockDeleteReviewComment.mockReset();
  });

  it('hydrates like state and count', async () => {
    mockGetLikeState.mockResolvedValue({
      reviewId: 'review-1',
      userId: 'user-1',
      liked: true,
      likeCount: 10,
    });

    await useEngagementStore.getState().hydrateLikeState({ reviewId: 'review-1', userId: 'user-1' });

    expect(useEngagementStore.getState().likedByReviewId['review-1']).toBe(true);
    expect(useEngagementStore.getState().likeCountByReviewId['review-1']).toBe(10);
  });

  it('optimistically toggles like and persists', async () => {
    useEngagementStore.setState({
      likedByReviewId: { 'review-1': false },
      likeCountByReviewId: { 'review-1': 2 },
    });

    mockSetReviewLiked.mockResolvedValue(undefined as never);

    const liked = await useEngagementStore.getState().toggleLike({ reviewId: 'review-1', userId: 'user-1' });

    expect(liked).toBe(true);
    expect(mockSetReviewLiked).toHaveBeenCalledWith({ reviewId: 'review-1', userId: 'user-1', liked: true });
    expect(useEngagementStore.getState().likeCountByReviewId['review-1']).toBe(3);
  });

  it('hydrates comments and supports create/delete lifecycle', async () => {
    mockListReviewComments.mockResolvedValue({
      items: [
        {
          id: 'c1',
          reviewId: 'review-1',
          userId: 'user-2',
          userName: 'A',
          userHandle: 'a',
          userAvatar: null,
          text: 'Hello',
          createdAt: '2026-02-13T10:00:00.000Z',
          updatedAt: '2026-02-13T10:00:00.000Z',
        },
      ],
      hasMore: false,
    });

    await useEngagementStore.getState().hydrateComments({ reviewId: 'review-1' });

    mockCreateReviewComment.mockResolvedValue({
      id: 'c2',
      reviewId: 'review-1',
      userId: 'user-1',
      userName: 'B',
      userHandle: 'b',
      userAvatar: null,
      text: 'My comment',
      createdAt: '2026-02-13T11:00:00.000Z',
      updatedAt: '2026-02-13T11:00:00.000Z',
    });

    await useEngagementStore.getState().postComment({
      reviewId: 'review-1',
      userId: 'user-1',
      userName: 'B',
      userHandle: 'b',
      userAvatar: null,
      text: 'My comment',
    });

    expect(useEngagementStore.getState().commentsByReviewId['review-1']?.items[0]?.id).toBe('c2');

    mockDeleteReviewComment.mockResolvedValue(undefined as never);
    await useEngagementStore.getState().deleteCommentAndStore({
      reviewId: 'review-1',
      commentId: 'c2',
      userId: 'user-1',
    });

    expect(
      useEngagementStore
        .getState()
        .commentsByReviewId['review-1']?.items.some((comment) => comment.id === 'c2')
    ).toBe(false);
  });
});
