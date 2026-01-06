export const generateSlug = (input: string | string[]): string => {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  if (typeof input === 'string') {
    return slugify(input);
  }

  if (Array.isArray(input)) {
    return input.map(slugify).join('-');
  }

  return '';
};
