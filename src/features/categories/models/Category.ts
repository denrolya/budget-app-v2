import moment, { Moment } from 'moment';

import type { CategoryDTO, CategoryTagDTO, CategoryType } from '../types';

export default class Category {
  id: number;
  name: string;
  type: CategoryType;
  color: string;
  createdAt: Moment;
  icon: string;
  isAffectingProfit: boolean;
  isTechnical: boolean;
  isFixed: boolean;
  tags: CategoryTagDTO[];

  parent: Category | null = null;
  root: Category | null = null;
  children: Category[] = [];

  constructor(data: CategoryDTO) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.color = data.color;
    this.createdAt = moment(data.createdAt);
    this.icon = data.icon;
    this.isAffectingProfit = data.isAffectingProfit;
    this.isTechnical = data.isTechnical;
    this.isFixed = data.isFixed;
    this.tags = data.tags;
  }

  addChild(child: Category): void {
    child.parent = this;
    this.children.push(child);
  }

  getFullPath(): string[] {
    const path: string[] = [this.name];
    let current = this.parent;

    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }

    return path;
  }
}
