import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import GuardianLoginPage from './GuardianLoginPage.jsx';
import GuardianRegisterPage from './GuardianRegisterPage.jsx';
import * as api from '../services/api.js';

vi.mock('../services/api.js', () => ({
    getGuardianFamily: vi.fn(),
    loginGuardian: vi.fn(),
    logoutGuardian: vi.fn(),
    registerGuardian: vi.fn(),
}));

const noSession = () => Object.assign(new Error('AUTHENTICATION_REQUIRED'), { status: 401 });

beforeEach(() => vi.resetAllMocks());
afterEach(() => cleanup());

describe('recuperación de la sesión del Guardián', () => {
    it('recupera familia y cierre de sesión al volver a montar el login', async () => {
        api.getGuardianFamily.mockResolvedValue({ familyCode: 'AB23CD45' });
        const first = render(<GuardianLoginPage />);
        await screen.findByText('AB23CD45');
        first.unmount();
        render(<GuardianLoginPage />);
        await screen.findByText('AB23CD45');
        expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
        expect(api.loginGuardian).not.toHaveBeenCalled();
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

    it('registra una cuenta nueva y permite continuar con la sesión creada', async () => {
        api.getGuardianFamily.mockRejectedValueOnce(noSession())
            .mockResolvedValueOnce({ familyCode: 'AB23CD45' });
        api.registerGuardian.mockResolvedValue({});
        const onLogin = vi.fn();
        render(<GuardianRegisterPage onLogin={onLogin} />);
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
        expect(onLogin).toHaveBeenCalledOnce();
    });

    it('permite entrar, salir y recargar sin recuperar el código anterior', async () => {
        api.getGuardianFamily.mockRejectedValueOnce(noSession())
            .mockResolvedValueOnce({ familyCode: 'AB23CD45' })
            .mockRejectedValueOnce(noSession());
        api.loginGuardian.mockResolvedValue({});
        api.logoutGuardian.mockResolvedValue({});
        const page = render(<GuardianLoginPage />);
        const email = await screen.findByLabelText('Tu correo electrónico');
        fireEvent.change(email, { target: { value: 'ficticio@example.com' } });
        fireEvent.change(screen.getByLabelText('Tu contraseña'), {
            target: { value: 'ClaveFicticiaParaPruebas!123' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
        await screen.findByText('AB23CD45');
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
        await screen.findByText('Sesión cerrada.');
        expect(screen.queryByText('AB23CD45')).toBeNull();
        page.unmount();
        render(<GuardianLoginPage />);
        await screen.findByLabelText('Tu correo electrónico');
        expect(screen.queryByText('AB23CD45')).toBeNull();
    });

    it('avisa si no puede comprobar la sesión por un fallo de servicio', async () => {
        api.getGuardianFamily.mockRejectedValue(new Error('fallo ficticio'));
        render(<GuardianLoginPage />);
        expect((await screen.findByRole('alert')).textContent).toContain('No pudimos comprobar');
        expect(screen.queryByText('Tu espacio familiar')).toBeNull();
    });

    it('permite copiar el código con su aviso de privacidad visible', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
        api.getGuardianFamily.mockResolvedValue({ familyCode: 'AB23CD45' });
        try {
            render(<GuardianLoginPage />);
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
