import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import { Card, CardBody, CardFooter } from '@/Components/ui/Card';
import MotorcycleLogo from '@/Components/ui/MotorcycleLogo';
import Icon from '@/Components/ui/Icon';
import { useTheme } from '@/hooks/use-theme';

export default function Login({ status }: { status?: string; canResetPassword?: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const { theme, toggle } = useTheme();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

    return (
        <div className="min-h-screen grid place-items-center bg-ink-50 text-ink-900 p-6 font-sans dark:bg-ink-950 dark:text-ink-100">
            <Head title="Entrar" />

            <button
                type="button"
                onClick={toggle}
                title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                aria-label="Alternar tema"
                className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
            >
                <Icon name={theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'} className="h-5 w-5" />
            </button>

            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-2 flex justify-center">
                        <MotorcycleLogo size={120} animated />
                    </div>
                    <h1 className="text-2xl font-bold">DUAS RODAS</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-400">Sistema de Gestão · Loja do Diogo</p>
                </div>

                <Card>
                    <form onSubmit={submit}>
                        <CardBody className="space-y-4">
                            {status && (
                                <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    {status}
                                </div>
                            )}
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                autoFocus
                                autoComplete="username"
                                required
                            />
                            <Input
                                label="Senha"
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                autoComplete="current-password"
                                required
                            />
                            <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-300">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-ink-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-ink-600 dark:bg-ink-900"
                                />
                                Lembrar-me neste computador
                            </label>
                        </CardBody>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={processing} size="lg">
                                <Icon name="mdi:login" className="h-5 w-5" />
                                Entrar
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <p className="mt-4 text-center text-xs text-ink-500">
                    Acesso restrito. Solicite credenciais ao administrador.
                </p>
            </div>
        </div>
    );
}
