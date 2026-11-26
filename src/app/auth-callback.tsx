// Landing route for the Google/Apple sign-in return link in the app; the session is set by the sign-in code.
import { Redirect } from 'expo-router';

export default function AuthCallback() {
  return <Redirect href="/(tabs)" />;
}
