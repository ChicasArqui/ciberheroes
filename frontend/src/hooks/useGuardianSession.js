import { useEffect, useState } from 'react';
import { getGuardianFamily } from '../services/api.js';

export default function useGuardianSession() {
    const [familyCode, setFamilyCode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [sessionError, setSessionError] = useState('');

    useEffect(() => {
        let active = true;
        getGuardianFamily()
            .then((family) => {
                if (!active) return;
                setFamilyCode(family.familyCode);
                setIsAuthenticated(true);
            })
            .catch((error) => {
                if (active && error.status !== 401) {
                    setSessionError('No pudimos comprobar tu sesión. Inténtalo más tarde.');
                }
            })
            .finally(() => {
                if (active) setIsCheckingSession(false);
            });
        return () => { active = false; };
    }, []);

    return {
        familyCode, setFamilyCode, isAuthenticated, setIsAuthenticated,
        isCheckingSession, sessionError
    };
}
