/**
 * Soft navigations use route-level loading.tsx skeletons.
 * This parent fallback stays null so those skeletons own the flash —
 * never a competing generic boxes UI.
 */
export default function AppLoading() {
  return null;
}
