export const arrayFromSearchQueryParam = (input: unknown): string[] => {
  let result = [];
  if (Array.isArray(input)) result = input;
  if (typeof input === 'string')
    result = input
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  return result;
};
