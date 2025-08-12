'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Oripa, Card, OripaCard } from '@prisma/client';

type OripaWithCards = Oripa & { cards: (OripaCard & { card: Card })[] };

export default function AdminOripaManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [oripas, setOripas] = useState<OripaWithCards[]>([]);
    const [allCards, setAllCards] = useState<Card[]>([]); // To select cards for oripa
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingOripa, setEditingOripa] = useState<OripaWithCards | null>(null);

    const [newOripaName, setNewOripaName] = useState('');
    const [newOripaDescription, setNewOripaDescription] = useState('');
    const [newOripaPrice, setNewOripaPrice] = useState(100);
    const [newOripaCardIds, setNewOripaCardIds] = useState<string[]>([]);

    useEffect(() => {
        if (status === 'loading') return;

        // Redirect if not authenticated or not admin
        if (!session || !session.user?.isAdmin) {
            router.push('/');
            return;
        }

        fetchOripas();
        fetchAllCards();
    }, [session, status, router]);

    const fetchOripas = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/oripas');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch oripas');
            }
            const data = await response.json();
            setOripas(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllCards = async () => {
        try {
            const response = await fetch('/api/admin/cards'); // Re-using admin cards API
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch all cards');
            }
            const data = await response.json();
            setAllCards(data);
        } catch (err) {
            console.error('Error fetching all cards:', err);
        }
    };

    const handleAddOripa = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await fetch('/api/admin/oripas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newOripaName,
                    description: newOripaDescription,
                    price: newOripaPrice,
                    cardIds: newOripaCardIds,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to add oripa');
            }

            setShowAddModal(false);
            setNewOripaName('');
            setNewOripaDescription('');
            setNewOripaPrice(100);
            setNewOripaCardIds([]);
            fetchOripas(); // Refresh list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleEditOripa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOripa) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/oripas/${editingOripa.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingOripa.name,
                    description: editingOripa.description,
                    price: editingOripa.price,
                    cardIds: editingOripa.cards.map(oc => oc.cardId), // Send current card IDs
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to update oripa');
            }

            setShowEditModal(false);
            setEditingOripa(null);
            fetchOripas(); // Refresh list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleDeleteOripa = async (oripaId: string) => {
        if (!confirm('Are you sure you want to delete this oripa?')) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/oripas/${oripaId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to delete oripa');
            }

            fetchOripas(); // Refresh list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    if (status === 'loading') return <div className="container mt-5">Loading...</div>;
    if (!session || !session.user?.isAdmin) return <div className="container mt-5 alert alert-danger">Access Denied. You must be an administrator to view this page.</div>;

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>オリパ管理</h2>
                <p className="lead">オリパパックの追加、編集、削除を行います。</p>
                <button className="btn btn-primary" onClick={() => {
                    setShowAddModal(true);
                    setNewOripaCardIds([]); // Reset selected cards for new oripa
                }}>新規オリパ追加</button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {isLoading ? (
                <div className="text-center">オリパを読み込み中...</div>
            ) : (
                <div className="row">
                    {oripas.length === 0 ? (
                        <div className="alert alert-info text-center">オリパが見つかりません。</div>
                    ) : (
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>名前</th>
                                    <th>説明</th>
                                    <th>価格</th>
                                    <th>カード</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {oripas.map((oripa) => (
                                    <tr key={oripa.id}>
                                        <td>{oripa.name}</td>
                                        <td>{oripa.description}</td>
                                        <td>{oripa.price}</td>
                                        <td>
                                            {oripa.cards.map(oc => oc.card.name).join(', ')}
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-warning me-2" onClick={() => {
                                                setEditingOripa(oripa);
                                                setShowEditModal(true);
                                            }}>編集</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteOripa(oripa.id)}>削除</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Add Oripa Modal */}
            {showAddModal && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleAddOripa}>
                                <div className="modal-header">
                                    <h5 className="modal-title">新規オリパ追加</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="oripaName" className="form-label">名前</label>
                                        <input type="text" className="form-control" id="oripaName" value={newOripaName} onChange={(e) => setNewOripaName(e.target.value)} required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="oripaDescription" className="form-label">説明</label>
                                        <textarea className="form-control" id="oripaDescription" value={newOripaDescription} onChange={(e) => setNewOripaDescription(e.target.value)} required></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="oripaPrice" className="form-label">価格</label>
                                        <input type="number" className="form-control" id="oripaPrice" value={newOripaPrice} onChange={(e) => setNewOripaPrice(Number(e.target.value))} required min="1" />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="oripaCards" className="form-label">カードを選択 (Ctrl/Cmdを押しながら複数選択)</label>
                                        <select
                                            multiple
                                            className="form-select"
                                            id="oripaCards"
                                            value={newOripaCardIds}
                                            onChange={(e) => setNewOripaCardIds(Array.from(e.target.selectedOptions, option => option.value))}
                                        >
                                            {allCards.map(card => (
                                                <option key={card.id} value={card.id}>{card.name} ({card.rarity})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>閉じる</button>
                                    <button type="submit" className="btn btn-primary">オリパを追加</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Oripa Modal */}
            {showEditModal && editingOripa && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditOripa}>
                                <div className="modal-header">
                                    <h5 className="modal-title">オリパ編集</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="editOripaName" className="form-label">名前</label>
                                        <input type="text" className="form-control" id="editOripaName" value={editingOripa.name} onChange={(e) => setEditingOripa({ ...editingOripa, name: e.target.value })} required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editOripaDescription" className="form-label">説明</label>
                                        <textarea className="form-control" id="editOripaDescription" value={editingOripa.description} onChange={(e) => setEditingOripa({ ...editingOripa, description: e.target.value })} required></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editOripaPrice" className="form-label">価格</label>
                                        <input type="number" className="form-control" id="editOripaPrice" value={editingOripa.price} onChange={(e) => setEditingOripa({ ...editingOripa, price: Number(e.target.value) })} required min="1" />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editOripaCards" className="form-label">カードを選択 (Ctrl/Cmdを押しながら複数選択)</label>
                                        <select
                                            multiple
                                            className="form-select"
                                            id="editOripaCards"
                                            value={editingOripa.cards.map(oc => oc.cardId)}
                                            onChange={(e) => {
                                                const selectedCardIds = Array.from(e.target.selectedOptions, option => option.value);
                                                const updatedCards = allCards.filter(card => selectedCardIds.includes(card.id)).map(card => ({ cardId: card.id, card: card })) as (OripaCard & { card: Card })[];
                                                setEditingOripa({ ...editingOripa, cards: updatedCards });
                                            }}
                                        >
                                            {allCards.map(card => (
                                                <option key={card.id} value={card.id}>{card.name} ({card.rarity})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>閉じる</button>
                                    <button type="submit" className="btn btn-primary">オリパを更新</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
