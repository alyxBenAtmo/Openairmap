const parseBooleanFlag = (
  value: string | undefined,
  defaultValue: boolean
): boolean => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (["false", "0", "off", "no", "disabled"].includes(normalized)) {
    return false;
  }

  if (["true", "1", "on", "yes", "enabled"].includes(normalized)) {
    return true;
  }

  return defaultValue;
};

export const featureFlags = {
  wildfireLayer: parseBooleanFlag(
    import.meta.env.VITE_ENABLE_WILDFIRE_LAYER as string | undefined,
    true
  ),
  solidLineNebuleAir: parseBooleanFlag(
    ((import.meta.env as unknown as Record<string, string | undefined>)
      .SOLID_LINE_NEBULEAIR ??
      (import.meta.env.VITE_SOLID_LINE_NEBULEAIR as string | undefined)) ??
      undefined,
    false
  ),
};


