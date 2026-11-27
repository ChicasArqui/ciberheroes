import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import './FamilyCodeDisplay.css';

export default function FamilyCodeDisplay({
    familyCode,
    title = 'El código de tu equipo',
    description = 'Los CiberHéroes lo usarán para encontrar su perfil.',
}) {
    const [copyStatus, setCopyStatus] = useState('');
    const copied = copyStatus === 'Código familiar copiado.';

    async function copyFamilyCode() {
        try {
            await navigator.clipboard.writeText(familyCode);
            setCopyStatus('Código familiar copiado.');
        } catch {
            setCopyStatus(
                'No se pudo copiar. Selecciona el código y cópialo manualmente.'
            );
        }
    }

    return (
        <section className="family-code-display" aria-labelledby="family-code-title">
            <h2 id="family-code-title">{title}</h2>
            <p className="family-code-description">{description}</p>
            <div className="family-code-row">
                <strong className="family-code-value">{familyCode}</strong>
                <button
                    className="button button-secondary family-code-copy"
                    type="button"
                    onClick={copyFamilyCode}
                    aria-label={copied ? 'Código familiar copiado' : 'Copiar código familiar'}
                >
                    {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
                    {copied ? 'Copiado' : 'Copiar código'}
                </button>
            </div>
            {copyStatus && (
                <p className="family-code-copy-status" role="status">
                    {copyStatus}
                </p>
            )}
        </section>
    );
}
