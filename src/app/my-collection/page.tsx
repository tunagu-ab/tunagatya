'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@prisma/client';

// Extend Card type to include UserCard properties for display
type UserCardDisplay = Card & {
    userCardId: string; // The ID of the UserCard entry
    isShipped: boolean;
    shippingRequestId: string | null;
};

export default function MyCollectionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cards, setCards] = useState<UserCardDisplay[]>([]); // Use UserCardDisplay type
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]); // UserCard IDs
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return; // Wait for session to load

        if (!session) {
            router.push('/login'); // Redirect to login if not authenticated
            return;
        }

        fetchCollection();
    }, [session, status, router]);

    const fetchCollection = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/my-collection');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'コレクションの取得に失敗しました');
            }
            const data = await response.json();
            // Map UserCard data to include userCardId and shipping status
            setCards(data.cards.map((uc: any) => ({
                ...uc.card,
                userCardId: uc.id,
                isShipped: uc.isShipped,
                shippingRequestId: uc.shippingRequestId,
            })));
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckboxChange = (userCardId: string) => {
        setSelectedCardIds(prev =>
            prev.includes(userCardId) ? prev.filter(id => id !== userCardId) : [...prev, userCardId]
        );
    };

    const handleRequestShipping = async () => {
        if (selectedCardIds.length === 0) {
            setMessage('発送するカードを選択してください。');
            return;
        }
        if (!confirm('選択したカードの発送をリクエストしますか？')) {
            return;
        }

        setIsLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch('/api/shipping/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userCardIds: selectedCardIds }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '発送リクエストに失敗しました');
            }

            setMessage('発送リクエストを送信しました！');
            setSelectedCardIds([]); // Clear selection
            fetchCollection(); // Refresh the list to update status

        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="container mt-5">コレクションを読み込み中...</div>;
    if (error) return <div className="container mt-5 alert alert-danger">エラー: {error}</div>;
    if (!session) return null; // Should have redirected by now

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>マイコレクション</h2>
                <p className="lead">あなたが獲得したカード</p>
            </div>

            {cards.length === 0 ? (
                <div className="alert alert-info text-center">まだカードがありません。ガチャを引いてみましょう！</div>
            ) : (
                <div className="row">
                    <div className="col-12 mb-3 text-end">
                        <button
                            className="btn btn-primary"
                            onClick={handleRequestShipping}
                            disabled={selectedCardIds.length === 0 || isLoading}
                        >
                            発送をリクエスト ({selectedCardIds.length})
                        </button>
                    </div>
                    {message && <div className="col-12 alert alert-success">{message}</div>}
                    {error && <div className="col-12 alert alert-danger">{error}</div>}
                    {cards.map((card) => (
                        <div key={card.userCardId} className="col-md-3 mb-4">
                            <div className="card shadow-sm h-100">
                                <img src={card.image} className="card-img-top" alt={card.name} style={{ height: '200px', objectFit: 'cover' }} />
                                <div className="card-body">
                                    <h5 className="card-title">{card.name}</h5>
                                    <p className="card-text">{card.description}</p>
                                    <span className="badge bg-primary">{card.rarity}</span>
                                    <div className="form-check mt-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`card-${card.userCardId}`}
                                            value={card.userCardId}
                                            onChange={() => handleCheckboxChange(card.userCardId)}
                                            checked={selectedCardIds.includes(card.userCardId)}
                                            disabled={card.isShipped} // Disable if already shipped
                                        />
                                        <label className="form-check-label" htmlFor={`card-${card.userCardId}`}>
                                            {card.isShipped ? '発送済み' : '発送対象'} 
                                            {card.shippingRequestId && !card.isShipped && '(リクエスト中)'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}