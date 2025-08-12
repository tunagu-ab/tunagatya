import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function Home() {
  const oripas = await prisma.oripa.findMany({
    include: {
      cards: {
        include: { card: true },
      },
    },
  });

  return (
    <main className="container">
      <div className="py-5 text-center">
        <h2>オリパ一覧</h2>
        <p className="lead">お好きなオリパを選んで運試し！</p>
      </div>

      <div className="row">
        {oripas.map((oripa) => (
          <div key={oripa.id} className="col-md-4">
            <div className="card mb-4 shadow-sm">
              {oripa.cards.length > 0 && (
                <img src={oripa.cards[0].card.image} className="card-img-top" alt={oripa.name} style={{ height: '200px', objectFit: 'cover' }} />
              )}
              <div className="card-body">
                <h5 className="card-title">{oripa.name}</h5>
                <p className="card-text">{oripa.description}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="btn-group">
                    <Link href={`/oripa/${oripa.id}`} className="btn btn-sm btn-outline-secondary">
                      詳細を見る
                    </Link>
                  </div>
                  <small className="text-muted">{oripa.price} ポイント</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
