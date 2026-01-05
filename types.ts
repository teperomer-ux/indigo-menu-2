
export type CategoryKey = 'sandwiches' | 'pastries' | 'asian' | 'desserts' | 'drinks';

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: CategoryKey;
  description?: string;
  available: boolean;
  image: string;
}

export interface NewItemData {
  name: string;
  price: string;
  description: string;
  image: string;
  category: CategoryKey;
}

export enum AdminView {
  NONE = 'NONE',
  PIN_PAD = 'PIN_PAD',
  EDIT = 'EDIT',
  ADD = 'ADD',
  DELETE_CONFIRM = 'DELETE_CONFIRM'
}
