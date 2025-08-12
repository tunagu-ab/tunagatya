'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@prisma/client';

export default function AdminCardManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);

    const [newCardName, setNewCardName] = useState('');
    const [newCardDescription, setNewCardDescription] = useState('');
    const [newCardImage, setNewCardImage] = useState(''); // Stores URL
    const [newCardImageFile, setNewCardImageFile] = useState<File | null>(null); // Stores File object
    const [newCardImagePreview, setNewCardImagePreview] = useState<string | null>(null); // Stores preview URL
    const newCardImageInputRef = useRef<HTMLInputElement>(null);

    const [newCardRarity, setNewCardRarity] = useState('N');

    const [editCardImageFile, setEditCardImageFile] = useState<File | null>(null);
    const [editCardImagePreview, setEditCardImagePreview] = useState<string | null>(null);
    const editCardImageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (status === 'loading') return;

        // Redirect if not authenticated or not admin
        if (!session || !session.user?.isAdmin) {
            router.push('/');
            return;
        }

        fetchCards();
    }, [session, status, router]);

    const fetchCards = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/cards');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'カードの取得に失敗しました');
            }
            const data = await response.json();
            setCards(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || '画像のアップロードに失敗しました');
        }
        const result = await response.json();
        return result.imageUrl;
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            let imageUrl = newCardImage; // Use existing URL if no new file
            if (newCardImageFile) {
                imageUrl = await handleImageUpload(newCardImageFile);
            }

            const response = await fetch('/api/admin/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCardName,
                    description: newCardDescription,
                    image: imageUrl,
                    rarity: newCardRarity,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'カードの追加に失敗しました');
            }

            setShowAddModal(false);
            setNewCardName('');
            setNewCardDescription('');
            setNewCardImage('');
            setNewCardImageFile(null);
            setNewCardImagePreview(null);
            if (newCardImageInputRef.current) newCardImageInputRef.current.value = '';
            fetchCards(); // Refresh list
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        }
    };

    const handleEditCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard) return;
        setError(null);
        try {
            let imageUrl = editingCard.image; // Use existing URL if no new file
            if (editCardImageFile) {
                imageUrl = await handleImageUpload(editCardImageFile);
            }

            const response = await fetch(`/api/admin/cards/${editingCard.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingCard.name,
                    description: editingCard.description,
                    image: imageUrl,
                    rarity: editingCard.rarity,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'カードの更新に失敗しました');
            }

            setShowEditModal(false);
            setEditingCard(null);
            setEditCardImageFile(null);
            setEditCardImagePreview(null);
            if (editCardImageInputRef.current) editCardImageInputRef.current.value = '';
            fetchCards(); // Refresh list
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!confirm('このカードを削除してもよろしいですか？')) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/cards/${cardId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'カードの削除に失敗しました');
            }

            fetchCards(); // Refresh list
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        }
    };

    if (status === 'loading') return <div className="container mt-5">読み込み中...</div>;
    if (!session || !session.user?.isAdmin) return <div className="container mt-5 alert alert-danger">アクセス拒否。このページを表示するには管理者である必要があります。</div>;

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>カード管理</h2>
                <p className="lead">カードの追加、編集、削除を行います。</p>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>新規カード追加</button>
            </div>

            {error && <div className="alert alert-danger">エラー: {error}</div>}

            {isLoading ? (
                <div className="text-center">カードを読み込み中...</div>
            ) : (
                <div className="row">
                    {cards.length === 0 ? (
                        <div className="alert alert-info text-center">カードが見つかりません。</div>
                    ) : (
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>画像</th>
                                    <th>名前</th>
                                    <th>説明</th>
                                    <th>レアリティ</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cards.map((card) => (
                                    <tr key={card.id}>
                                        <td><img src={card.image} alt={card.name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} /></td>
                                        <td>{card.name}</td>
                                        <td>{card.description}</td>
                                        <td>{card.rarity}</td>
                                        <td>
                                            <button className="btn btn-sm btn-warning me-2" onClick={() => {
                                                setEditingCard(card);
                                                setShowEditModal(true);
                                            }}>編集</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCard(card.id)}>削除</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Add Card Modal */}
            {showAddModal && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleAddCard}>
                                <div className="modal-header">
                                    <h5 className="modal-title">新規カード追加</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="cardName" className="form-label">名前</label>
                                        <input type="text" className="form-control" id="cardName" value={newCardName} onChange={(e) => setNewCardName(e.target.value)} required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="cardDescription" className="form-label">説明</label>
                                        <textarea className="form-control" id="cardDescription" value={newCardDescription} onChange={(e) => setNewCardDescription(e.target.value)} required></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="cardImage" className="form-label">画像ファイル</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            id="cardImage"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                setNewCardImageFile(file || null);
                                                setNewCardImagePreview(file ? URL.createObjectURL(file) : null);
                                            }}
                                            ref={newCardImageInputRef}
                                        />
                                        {newCardImagePreview && (
                                            <img src={newCardImagePreview} alt="画像プレビュー" style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px' }} />
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="cardRarity" className="form-label">レアリティ</label>
                                        <select className="form-select" id="cardRarity" value={newCardRarity} onChange={(e) => setNewCardRarity(e.target.value)}>
                                            <option value="N">N</option>
                                            <option value="R">R</option>
                                            <option value="SR">SR</option>
                                            <option value="SSR">SSR</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>閉じる</button>
                                    <button type="submit" className="btn btn-primary">カードを追加</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Card Modal */}
            {showEditModal && editingCard && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditCard}>
                                <div className="modal-header">
                                    <h5 className="modal-title">カード編集</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="editCardName" className="form-label">名前</label>
                                        <input type="text" className="form-control" id="editCardName" value={editingCard.name} onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })} required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editCardDescription" className="form-label">説明</label>
                                        <textarea className="form-control" id="editCardDescription" value={editingCard.description} onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })} required></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editCardImage" className="form-label">画像ファイル</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            id="editCardImage"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                setEditCardImageFile(file || null);
                                                setEditCardImagePreview(file ? URL.createObjectURL(file) : null);
                                            }}
                                            ref={editCardImageInputRef}
                                        />
                                        {editingCard.image && !editCardImagePreview && (
                                            <img src={editingCard.image} alt="現在の画像" style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px' }} />
                                        )}
                                        {editCardImagePreview && (
                                            <img src={editCardImagePreview} alt="新しい画像プレビュー" style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px' }} />
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editCardRarity" className="form-label">レアリティ</label>
                                        <select className="form-select" id="editCardRarity" value={editingCard.rarity} onChange={(e) => setEditingCard({ ...editingCard, rarity: e.target.value })}>
                                            <option value="N">N</option>
                                            <option value="R">R</option>
                                            <option value="SR">SR</option>
                                            <option value="SSR">SSR</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>閉じる</button>
                                    <button type="submit" className="btn btn-primary">カードを更新</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}