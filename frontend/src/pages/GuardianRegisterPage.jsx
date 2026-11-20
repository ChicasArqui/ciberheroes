import { useState } from 'react';
export default function GuardianRegisterPage() {
    const [password, setPassword] =useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    return(
        <section>
            <h1 className="form-title">Crea tu cuenta de Guardián para acompañar a tu 
                CiberHéroe
            </h1>

            <form onSubmit={(event) => event.preventDefault()}>
                <label htmlFor="email">Tu correo electrónico</label>
                <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                />
                <label htmlFor="password">Crea tu contraseña</label>
                <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={15}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                />
                <label htmlFor="confirmPassword">Repite tu contraseña</label>
                <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                />
                <button className="button button-primary" type="submit">
                    Crear cuenta de Guardián
                </button>
            </form>
        </section>
    );
}