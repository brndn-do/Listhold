import { processAvatarUrl } from '@/features/_shared/utils/avatarUtils';

describe('processAvatarUrl', () => {
  const googleBase = 'https://lh3.googleusercontent.com/a/ACg8rw';

  it('should return `/default-avatar.jpg` if url is not provided', () => {
    expect(processAvatarUrl()).toBe('/default-avatar.jpg');
  });

  it('should not modify non-Google URLs', () => {
    const url = 'https://examples.com/avatar.jpg';
    expect(processAvatarUrl(url, 32)).toBe(url);
  });

  it('should append correct size param to bare Google URLs', () => {
    const expected = `${googleBase}=s32-c`;
    expect(processAvatarUrl(googleBase, 32)).toBe(expected);
  });

  it('should replace existing size params in Google URLs', () => {
    const urlWithOldSize = `${googleBase}=s96-c`;
    const expected = `${googleBase}=s50-c`;

    expect(processAvatarUrl(urlWithOldSize, 50)).toBe(expected);
  });
});
