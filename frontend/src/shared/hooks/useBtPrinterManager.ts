import { useEffect } from 'react';
import { useBtPrinterStore } from '../store/useBtPrinterStore';

/**
 * Mount this hook ONCE at the App root level.
 * It listens for tab visibility/focus changes and triggers autoReconnect
 * so the Bluetooth connection survives tab switches and page navigations.
 */
export function useBtPrinterManager() {
    const autoReconnect = useBtPrinterStore(s => s.autoReconnect);

    useEffect(() => {
        // Initial reconnect attempt on app boot
        autoReconnect();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                console.log('[BT Manager] Tab became visible — checking Bluetooth connectivity...');
                autoReconnect();
            }
        };

        const handleFocus = () => {
            console.log('[BT Manager] Window focused — checking Bluetooth connectivity...');
            autoReconnect();
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleFocus);
        };
    }, [autoReconnect]);
}
