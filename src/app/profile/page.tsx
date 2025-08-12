'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    const [name, setName] = useState(session?.user?.name || '');
    const [addressLine1, setAddressLine1] = useState(session?.user?.addressLine1 || '');
    const [addressLine2, setAddressLine2] = useState(session?.user?.addressLine2 || '');
    const [city, setCity] = useState(session?.user?.city || '');
    const [state, setState] = useState(session?.user?.state || '');
    const [zipCode, setZipCode] = useState(session?.user?.zipCode || '');
    const [country, setCountry] = useState(session?.user?.country || '');

    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/login'); // Redirect to login if not authenticated
            return;
        }

        // Initialize form fields once session is loaded
        setName(session.user?.name || '');
        setAddressLine1(session.user?.addressLine1 || '');
        setAddressLine2(session.user?.addressLine2 || '');
        setCity(session.user?.city || '');
        setState(session.user?.state || '');
        setZipCode(session.user?.zipCode || '');
        setCountry(session.user?.country || '');

    }, [session, status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    zipCode,
                    country,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to update profile');
            }

            const result = await response.json();
            // Update session with new user data
            await update({ ...session, user: { ...session?.user, ...result.user } });
            setMessage('Profile updated successfully!');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading') return <div className="container mt-5">Loading profile...</div>;
    if (!session) return null; // Should have redirected by now

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>マイプロフィール</h2>
                <p className="lead">個人情報と配送先情報を管理します。</p>
            </div>

            <div className="row justify-content-center">
                <div className="col-md-8">
                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">名前</label>
                            <input type="text" className="form-control" id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">メールアドレス（変更不可）</label>
                            <input type="email" className="form-control" id="email" value={session.user?.email || ''} disabled />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="addressLine1" className="form-label">住所1</label>
                            <input type="text" className="form-control" id="addressLine1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="addressLine2" className="form-label">住所2（任意）</label>
                            <input type="text" className="form-control" id="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="city" className="form-label">市区町村</label>
                            <input type="text" className="form-control" id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="state" className="form-label">都道府県</label>
                            <input type="text" className="form-control" id="state" value={state} onChange={(e) => setState(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="zipCode" className="form-label">郵便番号</label>
                            <input type="text" className="form-control" id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="country" className="form-label">国</label>
                            <input type="text" className="form-control" id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? '保存中...' : 'プロフィールを保存'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
