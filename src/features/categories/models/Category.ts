import moment, { type Moment } from 'moment';

import type { CategoryDTO, CategoryType } from '../types';

export default class Category {
  id: number;
  name: string;
  type: CategoryType;
  createdAt: Moment;
  isAffectingProfit: boolean;

  parent: Category | null = null;
  root: Category | null = null;
  children: Category[] = [];

  private _depth: number | null = null;

  constructor(data: CategoryDTO) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.createdAt = moment(data.createdAt);
    this.isAffectingProfit = data.isAffectingProfit;
  }

  addChild(child: Category): void {
    child.parent = this;
    child._depth = null;
    this.children.push(child);
  }

  get depth(): number {
    if (this._depth !== null) return this._depth;

    let depth = 0;
    let current = this.parent;

    while (current) {
      depth += 1;
      current = current.parent;
    }

    this._depth = depth;
    return depth;
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
