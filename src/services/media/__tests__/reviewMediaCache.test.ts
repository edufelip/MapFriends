import {
  __resetReviewMediaCacheForTests,
  prefetchReviewImages,
} from '../reviewMediaCache';

describe('reviewMediaCache', () => {
  beforeEach(() => {
    __resetReviewMediaCacheForTests();
  });

  it('prefetches only unique valid remote urls', async () => {
    const prefetcher = jest.fn().mockResolvedValue(true);

    await prefetchReviewImages(
      [
        'https://cdn.example.com/a.jpg',
        ' https://cdn.example.com/a.jpg ',
        'http://cdn.example.com/b.jpg',
        '',
        'file://local/path.jpg',
      ],
      prefetcher
    );

    expect(prefetcher).toHaveBeenCalledTimes(2);
    expect(prefetcher).toHaveBeenNthCalledWith(1, 'https://cdn.example.com/a.jpg');
    expect(prefetcher).toHaveBeenNthCalledWith(2, 'http://cdn.example.com/b.jpg');
  });

  it('does not prefetch the same url twice after success', async () => {
    const prefetcher = jest.fn().mockResolvedValue(true);

    await prefetchReviewImages(['https://cdn.example.com/a.jpg'], prefetcher);
    await prefetchReviewImages(['https://cdn.example.com/a.jpg'], prefetcher);

    expect(prefetcher).toHaveBeenCalledTimes(1);
  });

  it('retries a url if previous prefetch failed', async () => {
    const prefetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(true);

    await prefetchReviewImages(['https://cdn.example.com/a.jpg'], prefetcher);
    await prefetchReviewImages(['https://cdn.example.com/a.jpg'], prefetcher);

    expect(prefetcher).toHaveBeenCalledTimes(2);
  });
});
