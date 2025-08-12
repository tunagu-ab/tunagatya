import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!isAdmin(session)) {
        redirect('/'); // Redirect non-admin users to home page
        return null; // Ensure a return in this branch
    }

    return (
        <main className="container">
            <div className="py-5 text-center">
                <h2>管理者ダッシュボード</h2>
                <p className="lead">アプリケーションのデータを管理します。</p>
            </div>

            <div className="list-group">
                <Link href="/admin/cards" className="list-group-item list-group-item-action">
                    カード管理
                </Link>
                <Link href="/admin/oripas" className="list-group-item list-group-item-action">
                    オリパ管理
                </Link>
                <Link href="/admin/shipping-requests" className="list-group-item list-group-item-action">
                    発送リクエスト管理
                </Link>
            </div>
        </main>
    );
}
