// auth-provider.tsx at /src/providers/

import { db, auth as firebaseAuth } from "@/lib/firebase";
import { getGoogleIdToken, signOutGoogle } from "@/lib/google-signin";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    linkWithCredential,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    type Auth,
    type AuthCredential,
    type User,
} from "firebase/auth";
import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
    updateDoc,
    type DocumentData,
} from "firebase/firestore";
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

const auth = firebaseAuth as unknown as Auth;

// true when the account can sign in with Google. Google already proved
// the user owns the email, so these users skip the email OTP
export function isGoogleUser(user: User | null): boolean {
    return !!user?.providerData.some((p) => p.providerId === "google.com");
}

// first Google sign in has no profile yet, make the same doc register.tsx
// makes so the root guard sends the user to account-setup.
// an existing profile stuck at the OTP step is finished instead
async function ensureGoogleProfile(user: User) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, {
            email: user.email,
            role: "resident",
            onboardingComplete: false,
            createdAt: serverTimestamp(),
            username: null,
            birthdate: null,
            language: null,
            barangay: null,
            phoneNumber: null,
        });
    } else if (
        snap.data().username &&
        snap.data().onboardingComplete === false
    ) {
        await updateDoc(ref, { onboardingComplete: true });
    }
}

type AuthContextValue = {
    user: User | null;
    profile: DocumentData | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<User>;
    signUp: (email: string, password: string) => Promise<User>;
    // null when the user closed the Google account picker
    signInWithGoogle: () => Promise<User | null>;
    logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<DocumentData | null>(null);
    const [authResolved, setAuthResolved] = useState(false);
    const [profileResolved, setProfileResolved] = useState(false);
    // a Google sign in that hit an email already registered with a
    // password. linked to that account after the next password login
    const pendingGoogleLink = useRef<{
        email: string;
        credential: AuthCredential;
    } | null>(null);

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

        // the user just proved they own the password account, so add the
        // Google sign in they tried before. Google works from then on
        const pending = pendingGoogleLink.current;
        if (
            pending &&
            pending.email.toLowerCase() ===
                credential.user.email?.toLowerCase()
        ) {
            pendingGoogleLink.current = null;
            try {
                await linkWithCredential(credential.user, pending.credential);
            } catch (err) {
                // the login itself worked, only the link failed
                console.error("Link Google account error:", err);
            }
        }

        return credential.user;
    };

    const signInWithGoogle = async () => {
        const google = await getGoogleIdToken();
        if (!google) return null;

        const googleCredential = GoogleAuthProvider.credential(google.idToken);
        try {
            // with Firebase's default "one account per email", a Google email
            // that is already registered signs in to that same account, so
            // the uid and profile stay the same
            const result = await signInWithCredential(auth, googleCredential);
            try {
                await ensureGoogleProfile(result.user);
            } catch (err) {
                // without a profile account-setup can't save, so start over
                await signOut(auth);
                throw err;
            }
            return result.user;
        } catch (err) {
            // the email belongs to a password account Firebase won't merge
            // on its own. keep the Google sign in for after the password login.
            // the email comes from Google, the error may not include it
            const code = (err as { code?: string }).code;
            if (code === "auth/account-exists-with-different-credential") {
                pendingGoogleLink.current = {
                    email: google.email,
                    credential: googleCredential,
                };
            }
            // so the account picker shows again on the next try
            await signOutGoogle();
            throw err;
        }
    };

    const logOut = async () => {
        await signOutGoogle();
        await signOut(auth);
    };

    const isLoading = !authResolved || !profileResolved;

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                isLoading,
                signIn,
                signUp,
                signInWithGoogle,
                logOut,
            }}
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
