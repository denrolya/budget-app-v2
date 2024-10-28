import Category from '@/models/Category';

export const logCategoriesTree = (categories: Category[], fields: string[]): string => {
  const simplifyCategory = (category: Category): any => {
    const result: any = {};

    // Include only the specified fields
    fields.forEach((field) => {
      if (field in category) {
        result[field] = category[field];
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
