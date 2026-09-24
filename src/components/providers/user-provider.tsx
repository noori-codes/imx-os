"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserContextValue = {
  email: string | null;
  name: string;
  initials: string;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  setName: (name: string) => void;
};

const UserContext = createContext<UserContextValue>({
  email: null,
  name: "there",
  initials: "?",
  avatarUrl: null,
  setAvatarUrl: () => {},
  setName: () => {},
});

type UserProviderProps = {
  email: string | null;
  name: string;
  initials: string;
  avatarUrl: string | null;
  children: ReactNode;
};

function initialsFromName(name: string, email: string | null) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  if (email) return email.slice(0, 1).toUpperCase();
  return "?";
}

export function UserProvider({
  email,
  name: initialName,
  initials: initialInitials,
  avatarUrl: initialAvatarUrl,
  children,
}: UserProviderProps) {
  const [name, setNameState] = useState(initialName);
  const [initials, setInitials] = useState(initialInitials);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  useEffect(() => {
    setNameState(initialName);
    setInitials(initialInitials);
    setAvatarUrl(initialAvatarUrl);
  }, [initialName, initialInitials, initialAvatarUrl]);

  function setName(next: string) {
    setNameState(next);
    setInitials(initialsFromName(next, email));
  }

  return (
    <UserContext.Provider
      value={{ email, name, initials, avatarUrl, setAvatarUrl, setName }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
