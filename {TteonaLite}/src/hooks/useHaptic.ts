const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AIT === "true";

export async function haptic(type: "tap" | "impact" | "notification" = "tap") {
  if (DEV_BYPASS) return;
  try {
    const { generateHapticFeedback } = await import("@apps-in-toss/web-framework");
    await generateHapticFeedback({ type });
  } catch {}
}

export const hapticTap = () => haptic("tap");
export const hapticImpact = () => haptic("impact");
export const hapticNotification = () => haptic("notification");
