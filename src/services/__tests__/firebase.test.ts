describe('normalizeStorageBucket', () => {
  it('strips gs:// prefix and trailing slash', () => {
    const { normalizeStorageBucket } = require('../firebaseStorageBucket');
    expect(normalizeStorageBucket('gs://mapfriends-92e3c.firebasestorage.app/')).toBe(
      'mapfriends-92e3c.firebasestorage.app'
    );
  });

  it('keeps plain bucket host unchanged', () => {
    const { normalizeStorageBucket } = require('../firebaseStorageBucket');
    expect(normalizeStorageBucket('mapfriends-92e3c.firebasestorage.app')).toBe(
      'mapfriends-92e3c.firebasestorage.app'
    );
  });
});
