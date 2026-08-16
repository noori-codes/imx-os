/**
 * Soft navigations keep the previous page visible via the top progress bar.
 * Route-specific loading UIs (e.g. dashboard/loading.tsx) own their skeletons.
 * Returning null here avoids a generic “boxes” flash that fights those layouts.
 */
export default function AppLoading() {
  return null;
}
