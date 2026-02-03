import ProfilePage from '@/components/profile/ProfilePage';
import { Metadata } from 'next';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Profile — Listhold',
  description: 'View your profile',
};

const Profile = () => <ProfilePage />;

export default Profile;
