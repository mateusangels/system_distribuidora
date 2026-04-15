import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import Icon from '@/Components/ui/Icon';
import type { PageProps } from '@/types';

export default function ProfileEdit() {
    const { props } = usePage<PageProps<{ status?: string }>>();
    const user = props.auth.user;

    // ---------- Perfil ----------
    const profileForm = useForm<{
        name: string;
        email: string;
        avatar: File | null;
        remove_avatar: boolean;
        _method: 'patch';
    }>({
        name: user.name ?? '',
        email: user.email ?? '',
        avatar: null,
        remove_avatar: false,
        _method: 'patch',
    });

    const [preview, setPreview] = useState<string | null>(user.avatar_url ?? null);
    const avatarInput = useRef<HTMLInputElement>(null);

    const pickAvatar = (file: File | null) => {
        if (file) {
            profileForm.setData('avatar', file);
            profileForm.setData('remove_avatar', false);
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            profileForm.setData('avatar', null);
        }
    };

    const removeAvatar = () => {
        profileForm.setData('avatar', null);
        profileForm.setData('remove_avatar', true);
        setPreview(null);
        if (avatarInput.current) avatarInput.current.value = '';
    };

    const submitProfile = (e: FormEvent) => {
        e.preventDefault();
        // usa POST com _method=patch pra suportar upload de arquivo
        profileForm.post('/profile', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    // ---------- Senha ----------
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitPassword = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.put('/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AppLayout title="Meu perfil">
            <Head title="Perfil" />

            <div className="mx-auto max-w-3xl space-y-6">
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-ink-100">
                    <Icon name="mdi:arrow-left" className="h-4 w-4" />
                    Voltar
                </Link>

                {/* ========== Dados pessoais + avatar ========== */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dados pessoais</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={submitProfile} className="space-y-5">
                            {/* Avatar */}
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt={profileForm.data.name}
                                            className="h-24 w-24 rounded-full object-cover border-2 border-ink-200 dark:border-ink-700"
                                        />
                                    ) : (
                                        <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-600 text-white text-3xl font-bold">
                                            {profileForm.data.name.charAt(0).toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <input
                                        ref={avatarInput}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={(e) => pickAvatar(e.target.files?.[0] ?? null)}
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => avatarInput.current?.click()}
                                        >
                                            <Icon name="mdi:camera-outline" className="h-4 w-4" />
                                            Escolher foto
                                        </Button>
                                        {(preview || user.avatar_url) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={removeAvatar}
                                                className="!text-red-600 dark:!text-red-400"
                                            >
                                                <Icon name="mdi:trash-can-outline" className="h-4 w-4" />
                                                Remover
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-ink-500">JPG, PNG ou WEBP · máx 4 MB</p>
                                    {profileForm.errors.avatar && (
                                        <p className="text-xs text-red-600 dark:text-red-400">{profileForm.errors.avatar}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                    label="Nome"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    error={profileForm.errors.name}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value.toLowerCase())}
                                    error={profileForm.errors.email}
                                    required
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={profileForm.processing}>
                                    <Icon name="mdi:content-save-outline" className="h-4 w-4" />
                                    Salvar alterações
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>

                {/* ========== Senha ========== */}
                <Card>
                    <CardHeader>
                        <CardTitle>Alterar senha</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={submitPassword} className="space-y-4">
                            <Input
                                label="Senha atual"
                                type="password"
                                autoComplete="current-password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                error={passwordForm.errors.current_password}
                                required
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                    label="Nova senha"
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    error={passwordForm.errors.password}
                                    hint="Mínimo 8 caracteres"
                                    required
                                />
                                <Input
                                    label="Confirme a nova senha"
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    error={passwordForm.errors.password_confirmation}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={passwordForm.processing}>
                                    <Icon name="mdi:lock-reset" className="h-4 w-4" />
                                    Atualizar senha
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
