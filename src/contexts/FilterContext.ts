import { createContext } from 'react';

export const FilterContext = createContext({
  searchQuery: '',
  assigneeFilter: '',
});
