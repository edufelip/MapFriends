import { getNotificationSections } from '../notifications';

describe('notifications service', () => {
  it('returns sectioned notifications', () => {
    const sections = getNotificationSections();
    expect(sections).toHaveProperty('newRequests');
    expect(sections).toHaveProperty('earlier');
    expect(sections).toHaveProperty('week');
    expect(Array.isArray(sections.newRequests)).toBe(true);
  });
});
