import Category from '@/models/Category';

export const logCategoriesTree = (categories: Category[], fields: string[]): string => {
  const simplifyCategory = (category: Category): any => {
    const result: any = {};

    fields.forEach((field) => {
      const key = field as keyof Category;
      if (key in category) {
        result[key] = category[key];
      }
    });

    // Handle children recursively if included in fields
    if (category.children && fields.includes('children')) {
      result.children = category.children.map(simplifyCategory);
    }

    return result;
  };

  // Map and simplify the input array
  const formattedCategories = categories.map(simplifyCategory);

  // Convert to JSON string
  return JSON.stringify(formattedCategories, null, 2);
};
