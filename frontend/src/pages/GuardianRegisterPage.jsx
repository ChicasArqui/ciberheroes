import { useState } from 'react';
import './GuardianRegisterPage.css';

export default function GuardianRegisterPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [formMessage, setFormMessage] = useState('');
    function handleSubmit(event) {
        event.preventDefault();
        setPasswordError('');
        setFormMessage('');

        if(password !== confirmPassword) {
            setPasswordError('Las contraseñas no coinciden. Revísalas e inténtalo de nuevo.');
            return;
        }

        setFormMessage('Validación correcta.');
    }
    return (
        <section className="guardian-register">
            <h1 className="form-title">Crea tu cuenta de Guardián para acompañar a tu
                CiberHéroe
            </h1>

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
                        required
                    />
                </div>

                <div className="guardian-field">
                    <label htmlFor="password">Crea tu contraseña</label>
                    <input
                        className="guardian-input"
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        minLength={15}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                <div className="guardian-field">
                    <label htmlFor="confirmPassword">Repite tu contraseña</label>
                    <input
                        className="guardian-input"
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        aria-invalid={Boolean(passwordError)}
                        aria-describedby={passwordError ? 'password-error' : undefined} 
                        required
                    />
                    {passwordError && (
                        <p id="password-error" className="guardian-error" role="alert">
                            {passwordError}
                        </p>
                    )}
                </div>

                <button
                    className="button button-primary guardian-submit"
                    type="submit"
                >
                    Crear cuenta de Guardián
                </button>
                {formMessage && (
                    <p className="guardian-message" role="status">
                        {formMessage}
                    </p>
                )}
            </form>
        </section>
    );
}