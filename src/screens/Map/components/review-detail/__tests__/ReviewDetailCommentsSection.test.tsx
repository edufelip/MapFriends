import React from 'react';
import { render } from '@testing-library/react-native';
import ReviewDetailCommentsSection from '../ReviewDetailCommentsSection';

describe('ReviewDetailCommentsSection', () => {
  const baseProps = {
    userId: 'user-1',
    isHydrating: false,
    isPosting: false,
    deletingById: {},
    onSubmit: jest.fn(async () => {}),
    onDelete: jest.fn(async () => {}),
    labels: {
      title: 'Comments',
      empty: 'No comments yet',
      placeholder: 'Write a comment',
      submit: 'Post',
      submitting: 'Posting',
      delete: 'Delete',
      deleteTitle: 'Delete comment',
      deleteMessage: 'Confirm',
      deleteErrorTitle: 'Error',
      deleteErrorMessage: 'Try again',
      cancel: 'Cancel',
    },
    theme: {
      textPrimary: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      surface: '#ffffff',
      primary: '#135bec',
      danger: '#ef4444',
      background: '#f8fafc',
    },
  };

  it('shows person placeholder when avatar is blank/whitespace', () => {
    const screen = render(
      <ReviewDetailCommentsSection
        {...baseProps}
        comments={[
          {
            id: 'comment-1',
            reviewId: 'review-1',
            userId: 'user-2',
            userName: 'Alex',
            userHandle: 'alex',
            userAvatar: '   ',
            text: 'Great review',
            createdAt: '2026-02-13T12:00:00.000Z',
            updatedAt: '2026-02-13T12:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.queryByTestId('comment-avatar-image-comment-1')).toBeNull();
    expect(screen.getByTestId('comment-avatar-fallback-comment-1')).toBeTruthy();
  });

  it('treats placeholder avatar urls as missing', () => {
    const screen = render(
      <ReviewDetailCommentsSection
        {...baseProps}
        comments={[
          {
            id: 'comment-2',
            reviewId: 'review-1',
            userId: 'user-2',
            userName: 'Alex',
            userHandle: 'alex',
            userAvatar: 'https://cdn.example.com/default-user/avatar.png',
            text: 'Another one',
            createdAt: '2026-02-13T12:00:00.000Z',
            updatedAt: '2026-02-13T12:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.queryByTestId('comment-avatar-image-comment-2')).toBeNull();
    expect(screen.getByTestId('comment-avatar-fallback-comment-2')).toBeTruthy();
  });

  it('renders image branch when avatar is present', () => {
    const screen = render(
      <ReviewDetailCommentsSection
        {...baseProps}
        comments={[
          {
            id: 'comment-3',
            reviewId: 'review-1',
            userId: 'user-2',
            userName: 'Alex',
            userHandle: 'alex',
            userAvatar: 'https://example.com/avatar.jpg',
            text: 'Another one',
            createdAt: '2026-02-13T12:00:00.000Z',
            updatedAt: '2026-02-13T12:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getByTestId('comment-avatar-fallback-comment-3')).toBeTruthy();
    expect(screen.getByTestId('comment-avatar-image-comment-3')).toBeTruthy();
  });
});
