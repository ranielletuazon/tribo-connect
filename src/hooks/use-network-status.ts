import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            // isInternetReachable can be null while it's still checking,
            // so we don't count that as offline
            setIsConnected(
                state.isConnected === true &&
                    state.isInternetReachable !== false,
            );
        });
        return unsubscribe;
    }, []);

    return isConnected;
}
