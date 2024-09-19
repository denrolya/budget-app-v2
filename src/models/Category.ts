interface CategoryData {
  id: number;
  name: string;
  parent: CategoryData | null;
  root: CategoryData | null;
  type: 'income' | 'expense';
  color: string;
  createdAt: string;
  icon: string;
  isAffectingProfit: boolean;
  isTechnical: boolean;
  tags: { name: string }[];
}

export default class Category {
  id: number;
  name: string;
  parent: Category | null;
  root: Category | null;
  type: 'income' | 'expense';
  color: string;
  createdAt: string;
  icon: string;
  isAffectingProfit: boolean;
  isTechnical: boolean;
  tags: { name: string }[];
  children: Category[];

  constructor(data: CategoryData) {
    this.id = data.id;
    this.name = data.name;
    this.parent = null; // We will link the parent later
    this.root = null; // We will link the root later
    this.type = data.type;
    this.color = data.color;
    this.createdAt = data.createdAt;
    this.icon = data.icon;
    this.isAffectingProfit = data.isAffectingProfit;
    this.isTechnical = data.isTechnical;
    this.tags = data.tags;
    this.children = [];
  }

  addChild(child: Category): void {
    child.parent = this;
    this.children.push(child);
  }
}

export class CategoryTreeBuilder {
  private categoryMap: Map<number, Category>;

  constructor() {
    this.categoryMap = new Map<number, Category>();
  }

  // Normalize and build the category tree structure
  normalizeData(categories: CategoryData[]): Category[] {
    // First pass: create unique category instances
    categories.forEach((data) => {
      if (!this.categoryMap.has(data.id)) {
        this.categoryMap.set(data.id, new Category(data));
      }
    });

    // Second pass: set up parent and root relationships
    categories.forEach((data) => {
      const category = this.categoryMap.get(data.id)!;

      // Link parent (reference to the existing parent object)
      if (data.parent && this.categoryMap.has(data.parent.id)) {
        const parent = this.categoryMap.get(data.parent.id)!;
        parent.addChild(category);
        category.parent = parent;
      }

      // Link root (reference to the existing root object)
      if (data.root && this.categoryMap.has(data.root.id)) {
        category.root = this.categoryMap.get(data.root.id)!;
      }
    });

    // Return root categories (top-level of the tree)
    return Array.from(this.categoryMap.values()).filter((cat) => cat.parent === null);
  }

  // Get the tree structure of categories (already built)
  getTree(): Category[] {
    return Array.from(this.categoryMap.values()).filter((cat) => cat.parent === null);
  }

  // Get a plain list of all categories
  getPlainList(): Category[] {
    return Array.from(this.categoryMap.values());
  }

  // Optionally, get a plain list of categories under a specific root
  getSubTreePlainList(rootId: number): Category[] {
    const rootCategory = this.categoryMap.get(rootId);
    if (!rootCategory) return [];

    const collectCategories = (category: Category, list: Category[]) => {
      list.push(category);
      category.children.forEach((child) => collectCategories(child, list));
    };

    const result: Category[] = [];
    collectCategories(rootCategory, result);
    return result;
  }

  getCategoryMap(): Map<number, Category> {
    return this.categoryMap;
  }
}
