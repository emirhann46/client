"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

type Anket = {
  _id: string;
  baslik: string;
  sorular: {
    soruMetni: string;
    secenekler: {
      metin: string;
      oylar: number;
      aciklamaIzni: boolean;
    }[];
  }[];
  cokluOyIzni: boolean;
  baslamaTarihi?: string;
  bitisTarihi?: string;
};

export default function AnketlerSayfasi() {
  const [anketler, setAnketler] = useState<Anket[]>([]);
  const [aciklamalar, setAciklamalar] = useState<{ [key: string]: string }>({});
  const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/anketler` : "http://localhost:5000/api/anketler";
  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Client ID oluşturma
  useEffect(() => {
    if (!localStorage.getItem("client-id")) {
      localStorage.setItem("client-id", uuidv4());
    }
  }, []);

  // Anketleri çekme ve Socket.IO
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then(setAnketler);

    const socket = io(SOCKET_URL);
    socket.on("anket-guncellendi", (guncelAnket) => {
      setAnketler((prev) =>
        prev.map((s) => (s._id === guncelAnket._id ? guncelAnket : s))
      );
    });

    return () => { socket.disconnect(); };
  }, []);

  // Oy verme işlemi
  const oyVer = async (anketId: string, soruIdx: number, secenekIdx: number) => {
    const key = `oy-verildi-${anketId}`;
    const anket = anketler.find((s) => s._id === anketId);

    // Oy kontrolü
    if (anket && !anket.cokluOyIzni && localStorage.getItem(key)) {
      alert("Bu ankete zaten oy kullandınız!");
      return;
    }

    // API'ye oy gönderme
    const kullaniciId = localStorage.getItem("client-id");
    const aciklamaKey = `${anketId}-${soruIdx}-${secenekIdx}`;
    const aciklama = aciklamalar[aciklamaKey] || "";

    await fetch(`${API_URL}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anketId,
        soruIdx,
        secenekIdx,
        kullaniciId,
        aciklama,
      }),
    });

    // Oy kaydı tutma
    if (anket && !anket.cokluOyIzni) {
      localStorage.setItem(key, "1");
    }
    setAciklamalar((prev) => ({ ...prev, [aciklamaKey]: "" }));
  };

  const simdi = new Date();

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-white min-h-screen rounded-2xl shadow-2xl">
      <h1 className="text-3xl font-extrabold mb-8 text-blue-700 text-center drop-shadow">
        Anketler
      </h1>

      {anketler.length === 0 && (
        <div className="text-gray-500 text-center py-8">Henüz anket yok.</div>
      )}

      <div className="flex flex-col gap-8">
        {anketler.map((anket) => {
          // Anket durumu kontrolleri
          const aktif =
            (!anket.baslamaTarihi || simdi >= new Date(anket.baslamaTarihi)) &&
            (!anket.bitisTarihi || simdi <= new Date(anket.bitisTarihi));

          const oyKullandi =
            !anket.cokluOyIzni &&
            !!localStorage.getItem(`oy-verildi-${anket._id}`);

          return (
            <div
              key={anket._id}
              className="border border-blue-100 bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition"
            >
              <h2 className="font-bold text-xl text-blue-700 mb-2 flex items-center gap-2">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path fill="#2563eb" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" />
                </svg>
                {anket.baslik}
              </h2>

              {/* Sorular ve seçenekler */}
              {(Array.isArray(anket.sorular) ? anket.sorular : []).map(
                (q, qIdx) => (
                  <div key={qIdx} className="mt-4">
                    <div className="font-medium text-blue-600 mb-1">
                      {qIdx + 1}. {q.soruMetni}
                    </div>
                    <ul className="space-y-2">
                      {(Array.isArray(q.secenekler) ? q.secenekler : []).map(
                        (opt, oIdx) => {
                          const aciklamaKey = `${anket._id}-${qIdx}-${oIdx}`;
                          return (
                            <li key={oIdx} className="flex flex-col gap-1 ml-2">
                              <div className="flex items-center gap-3">
                                <span className="text-base">{opt.metin}</span>
                                <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                                  {opt.oylar} oy
                                </span>
                                <button
                                  className={`px-3 py-1 rounded text-xs font-semibold shadow transition
                                    ${!aktif || oyKullandi
                                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                  onClick={() => oyVer(anket._id, qIdx, oIdx)}
                                  disabled={!aktif || oyKullandi}
                                >
                                  Oy Ver
                                </button>
                              </div>

                              {/* Açıklama alanı */}
                              {opt.aciklamaIzni && aktif && !oyKullandi && (
                                <input
                                  className="border border-blue-200 rounded p-1 mt-1 text-xs"
                                  placeholder="Açıklama (isteğe bağlı)"
                                  value={aciklamalar[aciklamaKey] || ""}
                                  onChange={(e) =>
                                    setAciklamalar((prev) => ({
                                      ...prev,
                                      [aciklamaKey]: e.target.value,
                                    }))
                                  }
                                />
                              )}
                            </li>
                          );
                        }
                      )}
                    </ul>
                  </div>
                )
              )}

              {/* Durum mesajları */}
              {!aktif && (
                <div className="text-red-500 text-sm mt-4">
                  {simdi < new Date(anket.baslamaTarihi || "")
                    ? "Anket henüz başlamadı."
                    : "Anket süresi doldu."}
                </div>
              )}
              {oyKullandi && (
                <div className="text-orange-500 text-xs mt-2">
                  Bu ankete zaten oy kullandınız.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}