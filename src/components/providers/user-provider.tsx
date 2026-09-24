"use client";

import { createContext, useContext, type ReactNode } from "react";

export type UserContextValue = {
  email: string | null;
  name: string;
  initials: string;
  avatarUrl: string | null;
};

const UserContext = createContext<UserContextValue>({
  email: null,
  name: "there",
  initials: "?",
  avatarUrl: null,
});

type UserProviderProps = {
  email: string | null;
  name: string;
  initials: string;
  avatarUrl: string | null;
  children: ReactNode;
};

export function UserProvider({
  email,
  name,
  initials,
  avatarUrl,
  children,
}: UserProviderProps) {
  return (
    <UserContext.Provider value={{ email, name, initials, avatarUrl }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
