'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ChargePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [chargeAmount, setChargeAmount] = useState(1000);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!session) {
        router.push('/login'); // Redirect to login if not authenticated
        return null;
    }

    const handleCharge = async () => {
        setIsLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch('/api/charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: chargeAmount }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to charge points');
            }

            const result = await response.json();
            await update({ ...session, user: { ...session?.user, points: result.user.points } });
            setMessage(`${chargeAmount} points charged successfully!`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>ポイントチャージ</h2>
                <p className="lead">現在のポイント: {session.user?.points}</p>
            </div>

            <div className="row justify-content-center">
                <div className="col-md-6">
                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="mb-3">
                        <label htmlFor="amount" className="form-label">チャージする金額を選択</label>
                        <select
                            id="amount"
                            className="form-select"
                            value={chargeAmount}
                            onChange={(e) => setChargeAmount(Number(e.target.value))}
                            disabled={isLoading}
                        >
                            <option value={1000}>1,000 ポイント</option>
                            <option value={5000}>5,000 ポイント</option>
                            <option value={10000}>10,000 ポイント</option>
                        </select>
                    </div>
                    <button
                        className="btn btn-primary w-100"
                        onClick={handleCharge}
                        disabled={isLoading}
                    >
                        {isLoading ? 'チャージ中...' : 'ポイントをチャージ'}
                    </button>
                </div>
            </div>
        </main>
    );
}
