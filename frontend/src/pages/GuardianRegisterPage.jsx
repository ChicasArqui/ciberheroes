import { useState } from 'react';
import {
    registerGuardian,
    getGuardianFamily
} from '../services/api.js';
import FamilyCodeDisplay from '../components/FamilyCodeDisplay.jsx';
import useGuardianSession from '../hooks/useGuardianSession.js';
import './GuardianRegisterPage.css';

export default function GuardianRegisterPage({ onLogin, onRegistrationComplete }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordPolicyError, setPasswordPolicyError] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {
        familyCode, setFamilyCode, isAuthenticated, setIsAuthenticated,
        isCheckingSession, sessionError
    } = useGuardianSession();
    const [registrationComplete, setRegistrationComplete] = useState(false);
    async function handleSubmit(event) {
        event.preventDefault();
        setPasswordError('');
        setFormMessage('');
        setPasswordPolicyError('');
        setFamilyCode('');

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);

        if (!hasUppercase || !hasLowercase || !hasSymbol) {
            setPasswordPolicyError(
                'Incluye al menos una mayúscula, una minúscula y un símbolo.'
            );
            return;
        }
        if (password !== confirmPassword) {
            setPasswordError(
                'Las contraseñas no coinciden. Revísalas e inténtalo de nuevo.'
            );
            return;
        }

        setIsSubmitting(true);

        try {
            await registerGuardian({ email, password });
            setIsAuthenticated(true);
            setPassword('');
            setConfirmPassword('');
            setFormMessage('Estamos preparando tu código familiar…');
            setRegistrationComplete(true);
            onRegistrationComplete?.();
        } catch (error) {
            if (error.code === 'EMAIL_ALREADY_EXISTS') {
                setFormMessage('Ya existe una cuenta con ese correo.');
            } else if (error.code === 'INVALID_INPUT') {
                setFormMessage('Revisa el correo y los requisitos de contraseña.');
            } else {
                setFormMessage('No pudimos crear la cuenta. Inténtalo más tarde.');
            }

            setIsSubmitting(false);
            return;
        }

        try {
            const family = await getGuardianFamily();
            setFamilyCode(family.familyCode);
            setFormMessage('¡Cuenta creada! Guarda este código familiar:');
        } catch {
            setFormMessage(
                'La cuenta se creó, pero no pudimos cargar el código. Inicia sesión para consultarlo.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }
    if (isCheckingSession) {
        return <p role="status">Comprobando tu sesión…</p>;
    }

    if (registrationComplete || isAuthenticated) {
        return (
            <section className="guardian-register guardian-registration-success" aria-live="polite">
                <div className="guardian-success-icon" aria-hidden="true">✓</div>
                <h1 className="form-title">¡Bienvenido, Guardián!</h1>
                <p className="guardian-intro">
                    Todo empieza con una familia que acompaña.
                </p>
                {familyCode ? (
                    <FamilyCodeDisplay
                        familyCode={familyCode}
                        description="Compártelo con el CiberHéroe para que encuentre su perfil."
                    />
                ) : (
                    <p className="guardian-message" role="status">
                        {formMessage || 'La cuenta se creó. Inicia sesión para consultar tu código familiar.'}
                    </p>
                )}
                <button
                    className="button button-primary guardian-submit"
                    type="button"
                    onClick={onLogin}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Preparando tu código…' : 'Ir a mi espacio familiar'}
                </button>
            </section>
        );
    }

    return (
        <section className="guardian-register">
            {sessionError && !formMessage && <p role="alert">{sessionError}</p>}
            <h1 className="form-title">Una aventura empieza en familia.</h1>
            <p className="guardian-intro">
                Crea tu cuenta de Guardián para acompañar a tu CiberHéroe.
            </p>

            <form
                className="guardian-form"
                onSubmit={handleSubmit}
            >
                <div className="guardian-field">
                    <label htmlFor="email">Tu correo electrónico</label>
                    <input
                        className="guardian-input"
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div className="guardian-field">
                    <label htmlFor="password">Crea tu contraseña</label>

                    <div className="guardian-password-control">
                        <input
                            className="guardian-input"
                            id="password"
                            aria-describedby="password-hint"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            minLength={15}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
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

                    <p id="password-hint" className="guardian-hint">
                        Usa al menos 15 caracteres, con mayúscula, minúscula y un símbolo.
                    </p>

                    {passwordPolicyError && (
                        <p className="guardian-error" role="alert">
                            {passwordPolicyError}
                        </p>
                    )}
                </div>

                <div className="guardian-field">
                    <label htmlFor="confirmPassword">Repite tu contraseña</label>

                    <div className="guardian-password-control">
                        <input
                            className="guardian-input"
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            aria-invalid={Boolean(passwordError)}
                            aria-describedby={passwordError ? 'password-error' : undefined}
                            required
                        />
                        <button
                            className="guardian-password-toggle"
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            aria-pressed={showConfirmPassword}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                                <circle cx="12" cy="12" r="3" />
                                {showConfirmPassword && <path d="M3 3l18 18" />}
                            </svg>
                        </button>
                    </div>

                    {passwordError && (
                        <p id="password-error" className="guardian-error" role="alert">
                            {passwordError}
                        </p>
                    )}
                </div>

                <button
                    className="button button-primary guardian-submit"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta de Guardián'}
                </button>
                {formMessage && (
                    <p className="guardian-message" role="status">
                        {formMessage}
                    </p>
                )}
                {familyCode && (
                    <FamilyCodeDisplay familyCode={familyCode} />
                )}
            </form>
        </section>
    );
}
