import { useState } from 'react';
import {
    getGuardianFamily,
    loginGuardian,
    logoutGuardian
} from '../services/api.js';
import FamilyCodeDisplay from '../components/FamilyCodeDisplay.jsx';
import SecurityChallenge from '../components/SecurityChallenge.jsx';
import useGuardianSession from '../hooks/useGuardianSession.js';
import './GuardianRegisterPage.css';

export default function GuardianLoginPage({ onRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState('');
    const [challenge, setChallenge] = useState(null);
    const [challengeToken, setChallengeToken] = useState('');
    const [challengeAttempt, setChallengeAttempt] = useState(0);
    const {
        familyCode, setFamilyCode, isAuthenticated, setIsAuthenticated,
        isCheckingSession, sessionError
    } = useGuardianSession();

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setFormMessage('');
        setFamilyCode('');

        try {
            await loginGuardian({ email, password, ...(challengeToken ? { challengeToken } : {}) });
            setChallenge(null);
            setChallengeToken('');
            setIsAuthenticated(true);
            setPassword('');
            setShowPassword(false);
        } catch (error) {
            if (error.code === 'CHALLENGE_REQUIRED' && error.challenge) {
                setChallenge(error.challenge);
                setFormMessage('Necesitamos una comprobación de seguridad para continuar.');
            } else if (error.code === 'INVALID_CREDENTIALS') {
                setFormMessage('Correo o contraseña incorrectos.');
            } else if (error.code === 'INVALID_INPUT') {
                setFormMessage('Ingresa un correo válido y tu contraseña.');
            } else if (error.code === 'TOO_MANY_REQUESTS') {
                const minutes = Math.max(1, Math.ceil(error.retryAfter / 60) || 1);
                setFormMessage(`Demasiados intentos. Vuelve a intentarlo en ${minutes} min.`);
            } else {
                setFormMessage('No pudimos iniciar sesión. Inténtalo más tarde.');
            }

            setChallengeToken('');
            setChallengeAttempt(value => value + 1);
            setIsSubmitting(false);
            return;
        }

        try {
            const family = await getGuardianFamily();
            setFamilyCode(family.familyCode);
        } catch {
            setFormMessage(
                'Sesión iniciada, pero no pudimos cargar el código familiar.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleLogout() {
        setIsSubmitting(true);
        setFormMessage('');

        try {
            await logoutGuardian();
            setIsAuthenticated(false);
            setFamilyCode('');
            setEmail('');
            setPassword('');
            setShowPassword(false);
            setFormMessage('Sesión cerrada.');
            setChallenge(null);
            setChallengeToken('');
        } catch {
            setFormMessage('No pudimos cerrar sesión. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isCheckingSession) {
        return <p role="status">Comprobando tu sesión…</p>;
    }

    return (
        <section className="guardian-register">
            <h1 className="form-title">
                {isAuthenticated ? 'Tu espacio familiar' : 'Inicia sesión como Guardián'}
            </h1>
            {sessionError && !isAuthenticated && !formMessage && <p role="alert">{sessionError}</p>}

            <form className="guardian-form" onSubmit={handleSubmit}>
                <div className="guardian-field">
                    <label htmlFor="login-email">Tu correo electrónico</label>
                    <input
                        className="guardian-input"
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setChallenge(null);
                            setChallengeToken('');
                        }}
                        disabled={isAuthenticated || isSubmitting}
                        required
                    />
                </div>

                <div className="guardian-field">
                    <label htmlFor="login-password">Tu contraseña</label>
                    <div className="guardian-password-control">
                        <input
                            className="guardian-input"
                            id="login-password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={isAuthenticated || isSubmitting}
                            required
                        />
                        <button
                            className="guardian-password-toggle"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            aria-pressed={showPassword}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                                <circle cx="12" cy="12" r="3" />
                                {showPassword && <path d="M3 3l18 18" />}
                            </svg>
                        </button>
                    </div>
                </div>

                {challenge && !isAuthenticated && <SecurityChallenge
                    key={challengeAttempt}
                    config={challenge}
                    onToken={setChallengeToken}
                />}

                <button
                    className="button button-primary guardian-submit"
                    type="submit"
                    disabled={isAuthenticated || isSubmitting || Boolean(challenge && !challengeToken)}
                >
                    {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
                </button>

                {formMessage && (
                    <p className="guardian-message" role="status">
                        {formMessage}
                    </p>
                )}

                {familyCode && (
                    <FamilyCodeDisplay familyCode={familyCode} />
                )}

                {isAuthenticated && (
                    <button
                        className="button button-secondary"
                        type="button"
                        onClick={handleLogout}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Cerrando sesión…' : 'Cerrar sesión'}
                    </button>
                )}

                <button
                    className="button button-secondary"
                    type="button"
                    onClick={onRegister}
                >
                    Crear cuenta de Guardián
                </button>
            </form>
        </section>
    );
}
