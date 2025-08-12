'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShippingRequest, User, UserCard, Card } from '@prisma/client';

type ShippingRequestWithDetails = ShippingRequest & {
    user: { name: string | null; email: string | null };
    userCards: (UserCard & { card: Card })[];
};

export default function AdminShippingRequestsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [requests, setRequests] = useState<ShippingRequestWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<ShippingRequestWithDetails | null>(null);

    const [editStatus, setEditStatus] = useState('');
    const [editShippedDate, setEditShippedDate] = useState('');
    const [editTrackingNumber, setEditTrackingNumber] = useState('');

    useEffect(() => {
        if (status === 'loading') return;

        // Redirect if not authenticated or not admin
        if (!session || !session.user?.isAdmin) {
            router.push('/');
            return;
        }

        fetchRequests();
    }, [session, status, router]);

    const fetchRequests = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/shipping-requests');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '発送リクエストの取得に失敗しました');
            }
            const data = await response.json();
            setRequests(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRequest) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/shipping-requests/${editingRequest.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: editStatus,
                    shippedDate: editShippedDate || null,
                    trackingNumber: editTrackingNumber || null,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '発送リクエストの更新に失敗しました');
            }

            setShowEditModal(false);
            setEditingRequest(null);
            fetchRequests(); // Refresh list
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        }
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (!confirm('この発送リクエストを削除してもよろしいですか？')) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/shipping-requests/${requestId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '発送リクエストの削除に失敗しました');
            }

            fetchRequests(); // Refresh list
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        }
    };

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

    if (status === 'loading') return <div className="container mt-5">読み込み中...</div>;
    if (!session || !session.user?.isAdmin) return <div className="container mt-5 alert alert-danger">アクセス拒否。このページを表示するには管理者である必要があります。</div>;

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>発送リクエスト管理</h2>
                <p className="lead">すべての発送リクエストを管理します。</p>
            </div>

            {error && <div className="alert alert-danger">エラー: {error}</div>}

            {isLoading ? (
                <div className="text-center">発送リクエストを読み込み中...</div>
            ) : (
                <div className="row">
                    {requests.length === 0 ? (
                        <div className="alert alert-info text-center">発送リクエストが見つかりません。</div>
                    ) : (
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>リクエストID</th>
                                    <th>ユーザー</th>
                                    <th>発送先住所</th>
                                    <th>ステータス</th>
                                    <th>リクエスト日時</th>
                                    <th>発送日時</th>
                                    <th>追跡番号</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request.id}>
                                        <td>{request.id}</td>
                                        <td>{request.user.name || request.user.email}</td>
                                        <td>{request.shippingAddress}</td>
                                        <td>{getStatusText(request.status)}</td>
                                        <td>{new Date(request.requestDate).toLocaleString()}</td>
                                        <td>{request.shippedDate ? new Date(request.shippedDate).toLocaleString() : '未発送'}</td>
                                        <td>{request.trackingNumber || '未登録'}</td>
                                        <td>
                                            <button className="btn btn-sm btn-warning me-2" onClick={() => {
                                                setEditingRequest(request);
                                                setEditStatus(request.status);
                                                setEditShippedDate(request.shippedDate ? new Date(request.shippedDate).toISOString().split('T')[0] : '');
                                                setEditTrackingNumber(request.trackingNumber || '');
                                                setShowEditModal(true);
                                            }}>編集</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRequest(request.id)}>削除</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Edit Request Modal */}
            {showEditModal && editingRequest && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditRequest}>
                                <div className="modal-header">
                                    <h5 className="modal-title">発送リクエスト編集</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="editStatus" className="form-label">ステータス</label>
                                        <select className="form-select" id="editStatus" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                                            <option value="PENDING">保留中</option>
                                            <option value="PROCESSING">処理中</option>
                                            <option value="SHIPPED">発送済み</option>
                                            <option value="DELIVERED">配達済み</option>
                                            <option value="CANCELLED">キャンセル済み</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editShippedDate" className="form-label">発送日時</label>
                                        <input type="date" className="form-control" id="editShippedDate" value={editShippedDate} onChange={(e) => setEditShippedDate(e.target.value)} />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editTrackingNumber" className="form-label">追跡番号</label>
                                        <input type="text" className="form-control" id="editTrackingNumber" value={editTrackingNumber} onChange={(e) => setEditTrackingNumber(e.target.value)} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>閉じる</button>
                                    <button type="submit" className="btn btn-primary">更新</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
