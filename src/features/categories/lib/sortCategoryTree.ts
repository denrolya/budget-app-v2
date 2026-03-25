/**
 * Canonical category sort: folders (categories with children) first, then alphabetically by name.
 * Recurses into children so every level of the tree is consistently ordered.
 *
 * Generic — works with Category model instances, ProcessedCategory, or any object
 * with `name: string` and `children: T[]`.
 */
const sortCategoryTree = <T extends { name: string; children: T[] }>(categories: T[]): T[] =>
  [...categories]
    .sort((a, b) => {
      const aIsFolder = a.children.length > 0;
      const bIsFolder = b.children.length > 0;
      if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((item) => {
      if (item.children.length > 0) {
        item.children = sortCategoryTree(item.children);
      }
      return item;
    });

export default sortCategoryTree;
