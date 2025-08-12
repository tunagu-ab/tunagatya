'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShippingRequest, UserCard, Card } from '@prisma/client';

type ShippingRequestWithDetails = ShippingRequest & {
    userCards: (UserCard & { card: Card })[];
};

export default function ShippingHistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [shippingRequests, setShippingRequests] = useState<ShippingRequestWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return; // Wait for session to load

        if (!session) {
            router.push('/login'); // Redirect to login if not authenticated
            return;
        }

        async function fetchShippingHistory() {
            try {
                const response = await fetch('/api/shipping/history');
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || '発送履歴の取得に失敗しました');
                }
                const data = await response.json();
                setShippingRequests(data.shippingRequests);
            } catch (err) {
                setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
            } finally {
                setIsLoading(false);
            }
        }

        fetchShippingHistory();
    }, [session, status, router]);

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return '保留中';
            case 'PROCESSING': return '処理中';
            case 'SHIPPED': return '発送済み';
            case 'DELIVERED': return '配達済み';
            case 'CANCELLED': return 'キャンセル済み';
            default: return status;
        }
    };

    if (isLoading) return <div className="container mt-5">発送履歴を読み込み中...</div>;
    if (error) return <div className="container mt-5 alert alert-danger">エラー: {error}</div>;
    if (!session) return null; // Should have redirected by now

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>発送履歴</h2>
                <p className="lead">これまでの発送リクエストと状況を確認できます。</p>
            </div>

            {shippingRequests.length === 0 ? (
                <div className="alert alert-info text-center">発送リクエストがありません。</div>
            ) : (
                <div className="row">
                    {shippingRequests.map((request) => (
                        <div key={request.id} className="col-12 mb-4">
                            <div className="card shadow-sm">
                                <div className="card-header">
                                    発送リクエストID: {request.id}
                                    <span className="badge bg-info ms-2">{getStatusText(request.status)}</span>
                                </div>
                                <div className="card-body">
                                    <p><strong>リクエスト日時:</strong> {new Date(request.requestDate).toLocaleString()}</p>
                                    <p><strong>発送先住所:</strong> {request.shippingAddress}</p>
                                    {request.shippedDate && <p><strong>発送日時:</strong> {new Date(request.shippedDate).toLocaleString()}</p>}
                                    {request.trackingNumber && <p><strong>追跡番号:</strong> {request.trackingNumber}</p>}
                                    
                                    <h6>含まれるカード:</h6>
                                    <ul className="list-group list-group-flush">
                                        {request.userCards.map((userCard) => (
                                            <li key={userCard.id} className="list-group-item">
                                                {userCard.card.name} ({userCard.card.rarity})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
