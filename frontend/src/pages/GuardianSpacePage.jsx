import { useEffect, useState } from 'react';
import { getGuardianFamily, logoutGuardian } from '../services/api.js';
import './GuardianSpacePage.css';

export default function GuardianSpacePage({ onLogin }) {
    const [sessionStatus, setSessionStatus] = useState('checking');
    const [sessionAttempt, setSessionAttempt] = useState(0);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

    useEffect(() => {
        let active = true;
        getGuardianFamily()
            .then(() => {
                if (active) setSessionStatus('authenticated');
            })
            .catch((error) => {
                if (!active) return;
                if (error.status === 401) {
                    onLogin();
                } else {
                    setSessionStatus('error');
                }
            });

        return () => { active = false; };
    }, [onLogin, sessionAttempt]);

    function retrySession() {
        setSessionStatus('checking');
        setSessionAttempt((attempt) => attempt + 1);
    }

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

    if (sessionStatus !== 'authenticated') {
        return (
            <main className="guardian-space-placeholder guardian-space-status">
                {sessionStatus === 'checking' ? (
                    <p role="status">Comprobando tu sesión…</p>
                ) : (
                    <div>
                        <p role="alert">No pudimos comprobar tu sesión. Revisa tu conexión e inténtalo de nuevo.</p>
                        <button className="button button-primary" type="button" onClick={retrySession}>
                            Reintentar
                        </button>
                    </div>
                )}
            </main>
        );
    }

    return (
        <main className="guardian-space-placeholder">
            {logoutError && <p className="guardian-space-error" role="alert">{logoutError}</p>}
            <button
                className="button button-primary guardian-space-logout"
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
            >
                {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
        </main>
    );
}
