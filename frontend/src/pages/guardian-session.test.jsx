import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import GuardianLoginPage from './GuardianLoginPage.jsx';
import GuardianRegisterPage from './GuardianRegisterPage.jsx';
import GuardianSpacePage from './GuardianSpacePage.jsx';
import * as api from '../services/api.js';

vi.mock('../services/api.js', () => ({
    getGuardianFamily: vi.fn(),
    getChildProfiles: vi.fn(),
    createChildProfile: vi.fn(),
    updateChildProfile: vi.fn(),
    loginGuardian: vi.fn(),
    logoutGuardian: vi.fn(),
    registerGuardian: vi.fn(),
}));

const noSession = () => Object.assign(new Error('AUTHENTICATION_REQUIRED'), { status: 401 });

beforeEach(() => {
    vi.resetAllMocks();
    api.getChildProfiles.mockResolvedValue({ profiles: [] });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('recuperación de la sesión del Guardián', () => {
    it('orienta al login cuando la cuenta se creó pero la sesión automática falló', async () => {
        api.getGuardianFamily.mockRejectedValue(noSession());
        api.registerGuardian.mockResolvedValue({
            guardian: { id: 'ficticio', email: 'ficticio@example.com' }, sessionCreated: false,
        });
        const onLogin = vi.fn();
        render(<GuardianRegisterPage onLogin={onLogin} />);
        fireEvent.change(await screen.findByLabelText('Tu correo electrónico'), { target: { value: 'ficticio@example.com' } });
        for (const label of ['Crea tu contraseña', 'Repite tu contraseña']) {
            fireEvent.change(screen.getByLabelText(label), { target: { value: 'ClaveFicticiaParaPruebas!123' } });
        }
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta de Guardián' }));
        await screen.findByText(/Tu cuenta ya se creó/);
        expect(api.registerGuardian).toHaveBeenCalledTimes(1);
        expect(api.getGuardianFamily).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('button', { name: 'Crear cuenta de Guardián' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
        expect(onLogin).toHaveBeenCalledTimes(1);
    });
    it('exige la comprobación y envía el token al reintentar el login', async () => {
        api.getGuardianFamily.mockRejectedValue(noSession());
        const config = { siteKey: 'publica-ficticia', action: 'guardian-login', cData: 'contexto' };
        api.loginGuardian.mockRejectedValueOnce(Object.assign(new Error('CHALLENGE_REQUIRED'), {
            code: 'CHALLENGE_REQUIRED', challenge: config,
        })).mockRejectedValueOnce(Object.assign(new Error('INVALID_CREDENTIALS'), { code: 'INVALID_CREDENTIALS' }));
        const renderWidget = vi.fn().mockReturnValue('widget-ficticio');
        const removeWidget = vi.fn();
        vi.stubGlobal('turnstile', { render: renderWidget, remove: removeWidget });
        const page = render(<GuardianLoginPage />);
        const email = await screen.findByLabelText('Tu correo electrónico');
        fireEvent.change(email, { target: { value: 'ficticio@example.com' } });
        fireEvent.change(screen.getByLabelText('Tu contraseña'), { target: { value: 'ClaveFicticia!12345' } });
        const submit = screen.getByRole('button', { name: 'Iniciar sesión' });
        fireEvent.click(submit);
        await screen.findByText(/Completa esta comprobación/);
        await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce());
        expect(submit.disabled).toBe(true);
        const widgetOptions = renderWidget.mock.calls[0][1];
        expect(widgetOptions).toEqual(expect.objectContaining({ sitekey: config.siteKey, cData: config.cData }));
        await waitFor(() => widgetOptions.callback('token-ficticio'));
        await waitFor(() => expect(submit.disabled).toBe(false));
        fireEvent.click(submit);
        await screen.findByText('Correo o contraseña incorrectos.');
        expect(api.loginGuardian).toHaveBeenLastCalledWith({
            email: 'ficticio@example.com', password: 'ClaveFicticia!12345', challengeToken: 'token-ficticio',
        });
        expect(submit.disabled).toBe(true);
        fireEvent.change(email, { target: { value: 'otra@example.com' } });
        await waitFor(() => expect(screen.queryByText(/Completa esta comprobación/)).toBeNull());
        expect(submit.disabled).toBe(false);
        page.unmount();
        expect(removeWidget).toHaveBeenCalled();
    });

    it('permite reintentar una comprobación fallida y descarta tokens vencidos', async () => {
        api.getGuardianFamily.mockRejectedValue(noSession());
        api.loginGuardian.mockRejectedValue(Object.assign(new Error('CHALLENGE_REQUIRED'), {
            code: 'CHALLENGE_REQUIRED', challenge: { siteKey: 'publica', action: 'guardian-login', cData: 'contexto' },
        }));
        const renderWidget = vi.fn().mockReturnValue('widget');
        vi.stubGlobal('turnstile', { render: renderWidget, remove: vi.fn() });
        render(<GuardianLoginPage />);
        fireEvent.change(await screen.findByLabelText('Tu correo electrónico'), { target: { value: 'ficticio@example.com' } });
        fireEvent.change(screen.getByLabelText('Tu contraseña'), { target: { value: 'ClaveFicticia!12345' } });
        const submit = screen.getByRole('button', { name: 'Iniciar sesión' });
        fireEvent.click(submit);
        await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce());
        const callbacks = renderWidget.mock.calls[0][1];
        await waitFor(() => callbacks.callback('token'));
        await waitFor(() => expect(submit.disabled).toBe(false));
        await waitFor(() => callbacks['expired-callback']());
        await waitFor(() => expect(submit.disabled).toBe(true));
        await waitFor(() => callbacks['error-callback']());
        const retry = await screen.findByRole('button', { name: 'Reintentar comprobación' });
        fireEvent.click(retry);
        await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(2));
    });

    it('permite recuperar la comprobación cuando falla la carga del script', async () => {
        api.getGuardianFamily.mockRejectedValue(noSession());
        api.loginGuardian.mockRejectedValue(Object.assign(new Error('CHALLENGE_REQUIRED'), {
            code: 'CHALLENGE_REQUIRED', challenge: { siteKey: 'publica', action: 'guardian-login', cData: 'contexto' },
        }));
        vi.stubGlobal('turnstile', undefined);
        render(<GuardianLoginPage />);
        fireEvent.change(await screen.findByLabelText('Tu correo electrónico'), { target: { value: 'ficticio@example.com' } });
        fireEvent.change(screen.getByLabelText('Tu contraseña'), { target: { value: 'ClaveFicticia!12345' } });
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
        await waitFor(() => expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).not.toBeNull());
        fireEvent.error(document.querySelector('script[src*="challenges.cloudflare.com"]'));
        const retry = await screen.findByRole('button', { name: 'Reintentar comprobación' });
        const renderWidget = vi.fn().mockReturnValue('widget');
        vi.stubGlobal('turnstile', { render: renderWidget, remove: vi.fn() });
        fireEvent.click(retry);
        await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce());
    });
    it.each(['login', 'registro'])('explica la espera por límite de %s sin mostrar éxito', async (mode) => {
        api.getGuardianFamily.mockRejectedValue(noSession());
        const blocked = Object.assign(new Error('TOO_MANY_REQUESTS'), {
            code: 'TOO_MANY_REQUESTS', status: 429, retryAfter: 900,
        });
        api.loginGuardian.mockRejectedValue(blocked);
        api.registerGuardian.mockRejectedValue(blocked);
        render(mode === 'login' ? <GuardianLoginPage /> : <GuardianRegisterPage />);
        const email = await screen.findByLabelText('Tu correo electrónico');
        fireEvent.change(email, { target: { value: 'ficticio@example.com' } });
        const labels = mode === 'login' ? ['Tu contraseña'] : ['Crea tu contraseña', 'Repite tu contraseña'];
        for (const label of labels) {
            fireEvent.change(screen.getByLabelText(label), {
                target: { value: 'ClaveFicticiaParaPruebas!123' },
            });
        }
        fireEvent.click(screen.getByRole('button', {
            name: mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta de Guardián',
        }));
        await screen.findByText(/Vuelve a intentarlo en 15 min/);
        expect(api.getGuardianFamily).toHaveBeenCalledTimes(mode === 'registro' ? 1 : 0);
        expect(screen.queryByText('Tu espacio familiar')).toBeNull();
    });
    it('mantiene el login separado aunque haya una sesión activa', async () => {
        api.getGuardianFamily.mockResolvedValue({ familyCode: 'AB23CD45' });
        render(<GuardianLoginPage />);
        await screen.findByRole('heading', { name: 'Inicia sesión como Guardián' });
        expect(screen.getByLabelText('Tu correo electrónico')).toBeTruthy();
        expect(screen.queryByText('AB23CD45')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
        expect(api.getGuardianFamily).not.toHaveBeenCalled();
    });

    it('recupera el código al recargar la pantalla posterior al registro', async () => {
        api.getGuardianFamily.mockResolvedValue({ familyCode: 'AB23CD45' });
        render(<GuardianRegisterPage />);
        await screen.findByText('AB23CD45');
        expect(screen.queryByRole('button', { name: 'Crear cuenta de Guardián' })).toBeNull();
        expect(screen.getByText(/Este código es privado/)).toBeTruthy();
        expect(api.registerGuardian).not.toHaveBeenCalled();
    });

    it('muestra el formulario cuando no existe sesión', async () => {
        api.getGuardianFamily.mockRejectedValue(noSession());
        render(<GuardianLoginPage />);
        await screen.findByLabelText('Tu correo electrónico');
        expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('registra una cuenta, muestra el código y permite abrir el espacio vacío', async () => {
        api.getGuardianFamily.mockRejectedValueOnce(noSession())
            .mockResolvedValueOnce({ familyCode: 'AB23CD45' });
        api.registerGuardian.mockResolvedValue({});
        const onGuardianSpace = vi.fn();
        render(<GuardianRegisterPage onGuardianSpace={onGuardianSpace} />);
        const email = await screen.findByLabelText('Tu correo electrónico');
        fireEvent.change(email, { target: { value: 'ficticio@example.com' } });
        for (const label of ['Crea tu contraseña', 'Repite tu contraseña']) {
            fireEvent.change(screen.getByLabelText(label), {
                target: { value: 'ClaveFicticiaParaPruebas!123' },
            });
        }
        fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta de Guardián' }));
        await screen.findByText('AB23CD45');
        expect(api.registerGuardian).toHaveBeenCalledWith({
            email: 'ficticio@example.com', password: 'ClaveFicticiaParaPruebas!123',
        });
        expect(screen.getByText(/Este código es privado/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Ir a mi espacio familiar' }));
        expect(onGuardianSpace).toHaveBeenCalledOnce();
    });

    it('inicia sesión sin mostrar el código ni el cierre de sesión', async () => {
        api.loginGuardian.mockResolvedValue({});
        const onAuthenticated = vi.fn();
        render(<GuardianLoginPage onAuthenticated={onAuthenticated} />);
        const email = await screen.findByLabelText('Tu correo electrónico');
        fireEvent.change(email, { target: { value: 'ficticio@example.com' } });
        fireEvent.change(screen.getByLabelText('Tu contraseña'), {
            target: { value: 'ClaveFicticiaParaPruebas!123' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
        await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce());
        expect(screen.queryByText('AB23CD45')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
    });

    it('verifica la sesión en el espacio vacío y vuelve al login si expiró', async () => {
        api.getGuardianFamily.mockRejectedValue(noSession());
        const onLogin = vi.fn();
        render(<GuardianSpacePage onLogin={onLogin} />);
        await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
        expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
    });

    it.each([
        ['conexión', new TypeError('Failed to fetch')],
        ['servidor', Object.assign(new Error('SERVER_ERROR'), { status: 500 })],
    ])('impide abrir el espacio ante un error de %s y permite recuperar la sesión', async (_kind, error) => {
        let resolveRetry;
        api.getGuardianFamily.mockRejectedValueOnce(error)
            .mockImplementationOnce(() => new Promise((resolve) => { resolveRetry = resolve; }));
        const onLogin = vi.fn();
        render(<GuardianSpacePage onLogin={onLogin} />);

        expect((await screen.findByRole('alert')).textContent).toContain('No pudimos comprobar tu sesión');
        expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
        expect(onLogin).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
        expect(screen.getByRole('status').textContent).toContain('Comprobando tu sesión');
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
        await waitFor(() => expect(api.getGuardianFamily).toHaveBeenCalledTimes(2));
        resolveRetry({ familyCode: 'AB23CD45' });

        await screen.findByRole('button', { name: 'Cerrar sesión' });
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.queryByText('AB23CD45')).toBeNull();
        expect(onLogin).not.toHaveBeenCalled();
    });

    it('mantiene el error si el reintento falla y vuelve al login si devuelve 401', async () => {
        api.getGuardianFamily.mockRejectedValueOnce(new Error('sin conexión'))
            .mockRejectedValueOnce(Object.assign(new Error('SERVER_ERROR'), { status: 500 }))
            .mockRejectedValueOnce(noSession());
        const onLogin = vi.fn();
        render(<GuardianSpacePage onLogin={onLogin} />);
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
        await screen.findByRole('alert');
        expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
        expect(onLogin).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
        await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
    });

    it('permite cerrar la sesión validada y regresar al inicio', async () => {
        api.getGuardianFamily.mockResolvedValue({ familyCode: 'AB23CD45' });
        api.logoutGuardian.mockResolvedValue({});
        const onHome = vi.fn();
        render(<GuardianSpacePage onLogin={vi.fn()} onHome={onHome} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
        await waitFor(() => expect(onHome).toHaveBeenCalledOnce());
        expect(api.logoutGuardian).toHaveBeenCalledOnce();
    });

    it('permite copiar el código con su aviso de privacidad visible', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
        api.getGuardianFamily.mockResolvedValue({ familyCode: 'AB23CD45' });
        try {
            render(<GuardianRegisterPage />);
            await screen.findByText('AB23CD45');
            fireEvent.click(screen.getByRole('button', { name: 'Copiar código familiar' }));
            await waitFor(() => expect(writeText).toHaveBeenCalledWith('AB23CD45'));
            await screen.findByText('Código familiar copiado.');
            expect(screen.getByText(/Compártelo únicamente con tu familia/)).toBeTruthy();
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
