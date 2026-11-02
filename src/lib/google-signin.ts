// google-signin.ts at /src/lib/

// the "Web client" (type 3) id from google-services.json. Firebase checks the
// Google id token against it. it's a public id, not a secret
const GOOGLE_WEB_CLIENT_ID =
    "214397287772-vs3pgh6httva576c3i2b5k7im0ajrprl.apps.googleusercontent.com";

type GoogleSigninModule =
    typeof import("@react-native-google-signin/google-signin");

// the library is native code, so it's missing in Expo Go and importing it
// there throws. load it only when needed, null means it isn't available
let googleModule: GoogleSigninModule | null | undefined;

function loadGoogleSignin(): GoogleSigninModule | null {
    if (googleModule !== undefined) return googleModule;
    try {
        googleModule =
            require("@react-native-google-signin/google-signin") as GoogleSigninModule;
        googleModule.GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
        });
    } catch (err) {
        console.warn("Google sign-in is not available in this build:", err);
        googleModule = null;
    }
    return googleModule;
}

export class GoogleSignInError extends Error {
    constructor(
        public code: "unavailable" | "play-services" | "in-progress" | "no-token",
    ) {
        super(`Google sign-in failed: ${code}`);
    }
}

// opens the Google account picker and returns the id token for Firebase
// and the chosen email, or null when the user closes the picker
export async function getGoogleIdToken(): Promise<{
    idToken: string;
    email: string;
} | null> {
    const google = loadGoogleSignin();
    if (!google) throw new GoogleSignInError("unavailable");
    const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } =
        google;

    try {
        await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
        });
        const response = await GoogleSignin.signIn();
        if (!isSuccessResponse(response)) return null;
        const { idToken, user } = response.data;
        if (!idToken) throw new GoogleSignInError("no-token");
        return { idToken, email: user.email };
    } catch (err) {
        if (isErrorWithCode(err)) {
            switch (err.code) {
                case statusCodes.SIGN_IN_CANCELLED:
                    return null;
                case statusCodes.IN_PROGRESS:
                    throw new GoogleSignInError("in-progress");
                case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                    throw new GoogleSignInError("play-services");
            }
        }
        throw err;
    }
}

// forgets the chosen Google account so the picker shows again next time
export async function signOutGoogle(): Promise<void> {
    const google = loadGoogleSignin();
    if (!google) return;
    try {
        await google.GoogleSignin.signOut();
    } catch (err) {
        console.error("Google sign out error:", err);
    }
}
