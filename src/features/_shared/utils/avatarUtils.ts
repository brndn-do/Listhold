export const processAvatarUrl = (url?: string | null, size = 96) => {
  if (!url) return '/default-avatar.jpg';
  if (url.includes('googleusercontent.com')) {
    // Check if it already has size params
    if (url.includes('=')) {
      // If it has sXX-c, replace it
      return url.replace(/=s\d+(-c)?/, `=s${size}-c`);
    }
    return `${url}=s${size}-c`;
  }
  return url;
};
