import { useState } from 'react';
import {
    getGuardianFamily,
    loginGuardian,
    logoutGuardian
} from '../services/api.js';
import './GuardianRegisterPage.css';

export default function GuardianLoginPage({ onRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState('');
    const [familyCode, setFamilyCode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setFormMessage('');
        setFamilyCode('');

        try {
            await loginGuardian({ email, password });
            setIsAuthenticated(true);
        } catch (error) {
            if (error.code === 'INVALID_CREDENTIALS') {
                setFormMessage('Correo o contraseña incorrectos.');
            } else if (error.code === 'INVALID_INPUT') {
                setFormMessage('Ingresa un correo válido y tu contraseña.');
            } else {
                setFormMessage('No pudimos iniciar sesión. Inténtalo más tarde.');
            }

            setIsSubmitting(false);
            return;
        }

        try {
            const family = await getGuardianFamily();
            setFamilyCode(family.familyCode);
            setFormMessage('Sesión iniciada. Tu código familiar es:');
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
            setFormMessage('Sesión cerrada.');
        } catch {
            setFormMessage('No pudimos cerrar sesión. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="guardian-register">
            <h1 className="form-title">Inicia sesión como Guardián</h1>

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
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={isAuthenticated || isSubmitting}
                        required
                    />
                </div>

                <div className="guardian-field">
                    <label htmlFor="login-password">Tu contraseña</label>
                    <input
                        className="guardian-input"
                        id="login-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={isAuthenticated || isSubmitting}
                        required
                    />
                </div>

                <button
                    className="button button-primary guardian-submit"
                    type="submit"
                    disabled={isAuthenticated || isSubmitting}
                >
                    {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
                </button>

                {formMessage && (
                    <p className="guardian-message" role="status">
                        {formMessage}
                    </p>
                )}

                {familyCode && (
                    <p className="guardian-message" role="status">
                        Código familiar: <strong>{familyCode}</strong>
                    </p>
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