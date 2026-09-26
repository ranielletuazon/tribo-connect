import { Ionicons } from "@expo/vector-icons";

export const VERIFIED_BLUE = "#2A6FDB";

// the blue check shown next to the name of a verified user
export function VerifiedBadge({ size = 14 }: { size?: number }) {
    return (
        <Ionicons
            name="checkmark-circle"
            size={size}
            color={VERIFIED_BLUE}
            accessibilityLabel="Verified"
        />
    );
}
