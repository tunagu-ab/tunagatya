'use client';

import { useState, useEffect } from 'react';
import { Oripa, Card, OripaCard } from '@prisma/client';

import { useSession } from 'next-auth/react';

// Define a more detailed type for the Oripa with its cards
type OripaWithCards = Oripa & {
    cards: (OripaCard & { card: Card })[];
};

type Props = {
    params: { id: string };
};

export default function OripaPage({ params }: Props) {
    const { data: session, update } = useSession();
    const [oripa, setOripa] = useState<OripaWithCards | null>(null);
    const [drawnCard, setDrawnCard] = useState<Card | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOripa() {
            try {
                const response = await fetch(`/api/oripa/${params.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch oripa data');
                }
                const data = await response.json();
                setOripa(data.oripa);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        }

        fetchOripa();
    }, [params.id]);

    const handleDraw = async () => {
        setDrawnCard(null);
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`/api/oripa/${params.id}/draw`, { method: 'POST' });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to draw a card');
            }
            const result = await response.json();
            setDrawnCard(result.card);
            // Update the session with the new user data from the API response
            await update({ ...session, user: { ...session?.user, points: result.user.points } });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !oripa) return <div>読み込み中...</div>;
    if (error) return <div>エラー: {error}</div>;
    if (!oripa) return <div>パックが見つかりません。</div>;

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>{oripa.name}</h2>
                <p className="lead">{oripa.description}</p>
                <p className="text-muted">価格: {oripa.price} ポイント</p>
            </div>

            <div className="text-center mb-4">
                <button className="btn btn-primary btn-lg" onClick={handleDraw} disabled={isLoading}>
                    {isLoading ? '抽選中...' : 'ガチャを引く'}
                </button>
            </div>

            {/* Result Modal */}
            {drawnCard && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">カードを獲得しました！</h5>
                                <button type="button" className="btn-close" onClick={() => setDrawnCard(null)}></button>
                            </div>
                            <div className="modal-body text-center">
                                <h4>{drawnCard.name}</h4>
                                <p>{drawnCard.description}</p>
                                {drawnCard.image && (
                                    <img src={drawnCard.image} alt={drawnCard.name} style={{ maxWidth: '150px', maxHeight: '150px', margin: '10px auto' }} />
                                )}
                                <h3>
                                    レアリティ: <span className="badge bg-warning">{drawnCard.rarity}</span>
                                </h3>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDrawnCard(null)}>
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                <div className="col-12">
                    <h4>このパックのカード</h4>
                    <ul className="list-group">
                        {oripa.cards.map(({ card }) => (
                            <li key={card.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {card.image && <img src={card.image} alt={card.name} style={{ width: '30px', height: '30px', objectFit: 'cover', marginRight: '10px' }} />}
                                {card.name} ({card.rarity})
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </main>
    );
}
