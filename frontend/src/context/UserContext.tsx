import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CurrentUser } from '../types';

interface UserContextValue {
  user: CurrentUser | null;
  setUser: Dispatch<SetStateAction<CurrentUser | null>>;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserContext.Provider');
  }
  return context;
}
