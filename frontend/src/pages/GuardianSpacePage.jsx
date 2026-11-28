import { useEffect, useState } from 'react';
import { getGuardianFamily, logoutGuardian } from '../services/api.js';
import './GuardianSpacePage.css';

export default function GuardianSpacePage({ onLogin }) {
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

    useEffect(() => {
        let active = true;
        getGuardianFamily()
            .catch((error) => {
                if (active && error.status === 401) onLogin();
            })
            .finally(() => {
                if (active) setIsCheckingSession(false);
            });

        return () => { active = false; };
    }, [onLogin]);

    async function handleLogout() {
        setIsLoggingOut(true);
        setLogoutError('');
        try {
            await logoutGuardian();
            onLogin();
        } catch {
            setLogoutError('No se pudo cerrar la sesión. Inténtalo de nuevo.');
            setIsLoggingOut(false);
        }
    }

    return (
        <main className="guardian-space-placeholder">
            {logoutError && <p className="guardian-space-error" role="alert">{logoutError}</p>}
            <button
                className="button button-primary guardian-space-logout"
                type="button"
                onClick={handleLogout}
                disabled={isCheckingSession || isLoggingOut}
            >
                {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
        </main>
    );
}
