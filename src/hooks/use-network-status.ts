import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            // isInternetReachable can briefly be `null` while still checking
            // (e.g. right at cold launch) — treat that as "not yet known to
            // be offline" rather than blocking on a false positive.
            setIsConnected(
                state.isConnected === true &&
                    state.isInternetReachable !== false,
            );
        });
        return unsubscribe;
    }, []);

    return isConnected;
}
