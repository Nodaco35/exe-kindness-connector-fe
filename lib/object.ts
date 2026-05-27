export const isJsonString = (value: string) => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

export const trimData = <T>(data: T): T => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item =>
      typeof item === 'string'
        ? item.trim()
        : typeof item === 'object' && item !== null
          ? trimData(item)
          : item,
    ) as T;
  }

  if (typeof data === 'object') {
    const nextValue: Record<string, unknown> = {};

    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'string') {
        nextValue[key] = value.trim();
      } else if (typeof value === 'object' && value !== null) {
        nextValue[key] = trimData(value);
      } else {
        nextValue[key] = value;
      }
    });

    return nextValue as T;
  }

  return data;
};
