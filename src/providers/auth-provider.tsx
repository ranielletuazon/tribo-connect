// auth-provider.tsx at /src/providers/

import { db, auth as firebaseAuth } from "@/lib/firebase";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type Auth,
    type User,
} from "firebase/auth";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

const auth = firebaseAuth as unknown as Auth;

type AuthContextValue = {
    user: User | null;
    profile: DocumentData | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<User>;
    signUp: (email: string, password: string) => Promise<User>;
    logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<DocumentData | null>(null);
    const [authResolved, setAuthResolved] = useState(false);
    const [profileResolved, setProfileResolved] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser);
            setAuthResolved(true);
            if (!nextUser) {
                setProfile(null);
                setProfileResolved(true);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user) return;

        setProfileResolved(false);
        const unsubscribe = onSnapshot(
            doc(db, "users", user.uid),
            (snapshot) => {
                setProfile(snapshot.exists() ? snapshot.data() : null);
                setProfileResolved(true);
            },
            () => {
                setProfile(null);
                setProfileResolved(true);
            },
        );
        return unsubscribe;
    }, [user]);

    const signUp = async (email: string, password: string) => {
        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
        );
        return credential.user;
    };

    const signIn = async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
        );
        return credential.user;
    };

    const logOut = async () => {
        await signOut(auth);
    };

    const isLoading = !authResolved || !profileResolved;

    return (
        <AuthContext.Provider
            value={{ user, profile, isLoading, signIn, signUp, logOut }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
