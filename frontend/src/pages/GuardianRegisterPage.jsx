import { useState } from 'react';
import './GuardianRegisterPage.css';

export default function GuardianRegisterPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    return (
        <section className="guardian-register">
            <h1 className="form-title">Crea tu cuenta de Guardián para acompañar a tu
                CiberHéroe
            </h1>

            <form
                className="guardian-form"
                onSubmit={(event) => event.preventDefault()}
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
                        required
                    />
                </div>

                <button
                    className="button button-primary guardian-submit"
                    type="submit"
                >
                    Crear cuenta de Guardián
                </button>
            </form>
        </section>
    );
}