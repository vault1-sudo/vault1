import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth } from "../firebase/auth";
import { db } from "../firebase/firestore";

export type Vault1Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "VIEWER"
  | "INVESTOR";

export type Vault1User = {
  uid: string;
  email: string | null;
  displayName: string;
  role: Vault1Role;
  permissions?: string[];
};

type AuthContextType = {
  user: User | null;
  profile: Vault1User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isVault1Role = (value: unknown): value is Vault1Role =>
  value === "SUPER_ADMIN" ||
  value === "ADMIN" ||
  value === "MANAGER" ||
  value === "VIEWER" ||
  value === "INVESTOR";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Vault1User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);

        if (!firebaseUser) {
          setProfile(null);
          return;
        }

        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName:
              typeof data.displayName === "string" &&
              data.displayName.trim().length > 0
                ? data.displayName
                : firebaseUser.displayName || "Vault1 User",
            role: isVault1Role(data.role) ? data.role : "VIEWER",
            permissions: Array.isArray(data.permissions)
              ? data.permissions.filter(
                  (permission: unknown): permission is string =>
                    typeof permission === "string"
                )
              : undefined,
          });
        } else {
          const newProfile: Vault1User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "Vault1 User",
            role: "VIEWER",
          };

          await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
          });

          setProfile(newProfile);
        }
      } catch (error) {
        console.error("Vault1 authentication profile load failed:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
  };

  const register = async (
    _email: string,
    _password: string,
    _displayName: string
  ) => {
    throw new Error(
      "Vault1 account creation is invitation-only. Please contact a Vault1 administrator."
    );
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
