"use client";

import { createContext, useContext, type ReactNode } from "react";

type UserContextValue = {
  email: string | null;
};

const UserContext = createContext<UserContextValue>({ email: null });

type UserProviderProps = {
  email: string | null;
  children: ReactNode;
};

export function UserProvider({ email, children }: UserProviderProps) {
  return (
    <UserContext.Provider value={{ email }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
