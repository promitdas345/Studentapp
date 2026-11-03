// Small navigation helpers shared by the screens.
import { router } from 'expo-router';

// Back to where the student came from, or to Today when the screen was opened straight from a
// notification and there's nothing behind it.
export function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
