import { createFavoritesRepository } from './favoritesRepository';
import { FavoriteRecord, SaveFavoriteInput } from './types';

const repository = createFavoritesRepository();

export type { FavoriteRecord, SaveFavoriteInput };
export type { FavoriteReviewSnapshot } from './types';

export async function saveFavorite(input: SaveFavoriteInput): Promise<FavoriteRecord> {
  return repository.saveFavorite(input);
}

export async function removeFavorite(input: { userId: string; reviewId: string }): Promise<void> {
  return repository.removeFavorite(input);
}

export async function listFavorites(input: {
  userId: string;
  limit?: number;
}): Promise<FavoriteRecord[]> {
  return repository.listFavorites({
    userId: input.userId,
    limit: input.limit ?? 120,
  });
}
