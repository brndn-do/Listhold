export interface SignupData {
  displayName: string;
  signupTime: Date;
  photoURL: string | null;
  email: string;
  answers?: Record<string, boolean | null>;
}
