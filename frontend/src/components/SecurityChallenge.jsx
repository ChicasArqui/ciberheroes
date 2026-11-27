import { useEffect, useRef, useState } from 'react';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise;

function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timeout = window.setTimeout(fail, 15000);
            function fail() {
                window.clearTimeout(timeout);
                script.remove();
                scriptPromise = undefined;
                reject(new Error('No se pudo cargar la comprobación'));
            }
            script.src = SCRIPT_URL;
            script.async = true;
            script.onload = () => {
                window.clearTimeout(timeout);
                if (window.turnstile) resolve(window.turnstile);
                else fail();
            };
            script.onerror = fail;
            document.head.appendChild(script);
        });
    }
    return scriptPromise;
}

export default function SecurityChallenge({ config, onToken }) {
    const container = useRef(null);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let cancelled = false;
        let sdk;
        let widget;
        loadTurnstile().then(api => {
            if (cancelled) return;
            sdk = api;
            widget = api.render(container.current, {
                sitekey: config.siteKey,
                action: config.action,
                cData: config.cData,
                language: 'es',
                size: 'flexible',
                callback: token => { if (!cancelled) onToken(token); },
                'expired-callback': () => { if (!cancelled) onToken(''); },
                'error-callback': () => {
                    if (!cancelled) {
                        onToken('');
                        setError('No pudimos completar la comprobación. Inténtalo de nuevo.');
                    }
                },
            });
        }).catch(() => {
            if (!cancelled) setError('No pudimos cargar la comprobación. Revisa tu conexión e inténtalo de nuevo.');
        });
        return () => {
            cancelled = true;
            if (widget !== undefined) sdk.remove(widget);
        };
    }, [config, onToken, retry]);

    return (
        <div className="guardian-security-check">
            <p>Completa esta comprobación de seguridad para continuar.</p>
            <div ref={container} />
            {error && <>
                <p role="alert">{error}</p>
                <button type="button" className="button button-secondary" onClick={() => {
                    setError('');
                    onToken('');
                    setRetry(value => value + 1);
                }}>Reintentar comprobación</button>
            </>}
        </div>
    );
}
