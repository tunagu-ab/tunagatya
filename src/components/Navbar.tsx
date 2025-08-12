'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Nav from 'react-bootstrap/Nav';
import NavbarBs from 'react-bootstrap/Navbar';
import { useEffect } from 'react';

export default function Navbar() {
    const { data: session, status } = useSession();

    useEffect(() => {
        // Dynamically import Bootstrap's JS on the client side
        import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }, []);

    return (
        <NavbarBs bg="dark" variant="dark" expand="md">
            <div className="container">
                <Link href="/" className="navbar-brand">
                    TUNAGATYA
                </Link>
                <NavbarBs.Toggle aria-controls="basic-navbar-nav" />
                <NavbarBs.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto">
                        {status === "loading" ? (
                            <Nav.Link>読み込み中...</Nav.Link>
                        ) : session ? (
                            <NavDropdown title={`${session.user?.name} (ポイント: ${session.user?.points})`} id="basic-nav-dropdown" align="end">
                                <NavDropdown.Item as={Link} href="/charge">ポイントチャージ</NavDropdown.Item>
                                <NavDropdown.Item as={Link} href="/profile">マイプロフィール</NavDropdown.Item>
                                {session.user?.isAdmin && (
                                    <NavDropdown.Item as={Link} href="/admin">管理者ダッシュボード</NavDropdown.Item>
                                )}
                                <NavDropdown.Item as={Link} href="/my-collection">マイコレクション</NavDropdown.Item>
                                <NavDropdown.Item as={Link} href="/shipping-history">発送履歴</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={() => signOut()}>
                                    ログアウト
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <>
                                <Nav.Link as={Link} href="/login">
                                    ログイン
                                </Nav.Link>
                                <Nav.Link as={Link} href="/register">
                                    新規登録
                                </Nav.Link>
                            </>
                        )}
                    </Nav>
                </NavbarBs.Collapse>
            </div>
        </NavbarBs>
    );
}
