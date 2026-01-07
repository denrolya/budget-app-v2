export type Category = {
  id: string;
  name: string;
  budgeted: number;
  actual: number;
  children?: Category[];
};

export type Budget = {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  categories: Category[];
};
