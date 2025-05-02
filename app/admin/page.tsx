"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type SekmeType = "olustur" | "liste" | "grafikler";
type Soru = { soruMetni: string; secenekler: { metin: string; aciklamaIzni: boolean }[] };
type Anket = {
  _id: string;
  baslik: string;
  sorular: any[];
  cokluSecim: boolean;
  cokluOyIzni: boolean;
  baslamaTarihi?: string;
  bitisTarihi?: string;
};

export default function AdminPage() {
  const [baslik, setBaslik] = useState("");
  const [sorular, setSorular] = useState<Soru[]>([
    { soruMetni: "", secenekler: [{ metin: "", aciklamaIzni: false }] }
  ]);
  const [cokluSecim, setCokluSecim] = useState(false);
  const [cokluOyIzni, setCokluOyIzni] = useState(true);
  const [baslamaTarihi, setBaslamaTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [hata, setHata] = useState("");
  const [anketler, setAnketler] = useState<Anket[]>([]);
  const [duzenleId, setDuzenleId] = useState<string | null>(null);
  const [sekme, setSekme] = useState<SekmeType>("liste");

  const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/anketler` : "http://localhost:5000/api/anketler";
  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const anketleriGetir = () => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setAnketler(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    anketleriGetir();
    const socket = io(SOCKET_URL);
    socket.on("anket-guncellendi", (guncelAnket) => {
      setAnketler((prev) => prev.map((s) => (s._id === guncelAnket._id ? guncelAnket : s)));
    });
    return () => { socket.disconnect(); };
  }, []);

  const soruEkle = () => {
    setSorular([...sorular, { soruMetni: "", secenekler: [{ metin: "", aciklamaIzni: false }] }]);
  };

  const secenekEkle = (qIdx: number) => {
    const guncellenen = [...sorular];
    guncellenen[qIdx].secenekler.push({ metin: "", aciklamaIzni: false });
    setSorular(guncellenen);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu anketi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (res.ok) anketleriGetir();
    else setHata("Silme işlemi başarısız oldu!");
  };

  const handleEdit = (anket: Anket) => {
    setDuzenleId(anket._id);
    setBaslik(anket.baslik);
    setSorular(anket.sorular.map((q) => ({
      soruMetni: q.soruMetni,
      secenekler: q.secenekler.map((opt: any) => ({
        metin: opt.metin,
        aciklamaIzni: opt.aciklamaIzni,
      })),
    })));
    setCokluSecim(anket.cokluSecim);
    setCokluOyIzni(anket.cokluOyIzni);
    setBaslamaTarihi(anket.baslamaTarihi ? anket.baslamaTarihi.slice(0, 16) : "");
    setBitisTarihi(anket.bitisTarihi ? anket.bitisTarihi.slice(0, 16) : "");
    setHata("");
    setSekme("olustur");
  };

  const formuSifirla = () => {
    setDuzenleId(null);
    setBaslik("");
    setSorular([{ soruMetni: "", secenekler: [{ metin: "", aciklamaIzni: false }] }]);
    setCokluSecim(false);
    setCokluOyIzni(true);
    setBaslamaTarihi("");
    setBitisTarihi("");
    setHata("");
  };

  const duzenlemeIptal = () => {
    formuSifirla();
    setSekme("liste");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");

    if (bitisTarihi < baslamaTarihi) {
      setHata("Bitiş tarihi, başlangıç tarihinden önce olamaz!");
      return;
    }
    if (!baslik || sorular.some(q => !q.soruMetni || q.secenekler.some(opt => !opt.metin))) {
      setHata("Lütfen tüm soruları ve seçenekleri doldurun!");
      return;
    }

    const anket = { baslik, sorular, cokluSecim, cokluOyIzni, baslamaTarihi, bitisTarihi };
    const url = duzenleId ? `${API_URL}/${duzenleId}` : `${API_URL}/create`;
    const method = duzenleId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(anket),
    });

    if (res.ok) {
      alert(duzenleId ? "Anket başarıyla güncellendi!" : "Anket başarıyla oluşturuldu!");
      formuSifirla();
      anketleriGetir();
      setSekme("liste");
    } else {
      setHata("Bir hata oluştu, lütfen tekrar deneyin!");
    }
  };

  const grafikleriGoster = () => (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M3 17a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4Zm7 2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2Zm7 0a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2Z" /></svg>
        Canlı Anket Sonuçları
      </h2>
      {anketler.length === 0 && (
        <div className="text-gray-500 text-center py-8">Henüz anket yok.</div>
      )}
      <div className="flex flex-col gap-10">
        {anketler.map((anket) =>
          anket.sorular.map((q: any, qIdx: number) => {
            const data = {
              labels: q.secenekler.map((opt: any) => opt.metin),
              datasets: [{
                label: "Oy Sayısı",
                data: q.secenekler.map((opt: any) => opt.oylar),
                backgroundColor: ["#2563eb", "#22d3ee", "#fbbf24", "#f87171", "#a78bfa", "#34d399"],
                borderRadius: 8,
              }],
            };
            return (
              <div key={anket._id + "-" + qIdx} className="bg-white shadow-lg rounded-xl p-6 border border-blue-100">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-blue-700">{anket.baslik}</span>
                  <span className="text-xs text-gray-500">{qIdx + 1}. Soru: {q.soruMetni}</span>
                </div>
                <Bar
                  data={data}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false }, title: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "#e0e7ef" } },
                      x: { grid: { color: "#f1f5f9" } },
                    },
                  }}
                  height={120}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const SekmeButonu = ({ sekmeName, etiket }: { sekmeName: SekmeType; etiket: string }) => (
    <button
      className={`px-4 py-2 rounded font-semibold transition ${sekme === sekmeName ? "bg-blue-600 text-white shadow" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
        }`}
      onClick={() => {
        setSekme(sekmeName);
        if (sekmeName !== "olustur") formuSifirla();
      }}
    >
      {sekmeName === "olustur" && duzenleId ? "Anketi Düzenle" : etiket}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-0 min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow rounded-b-2xl mb-8">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" /></svg>
          <span className="text-2xl font-bold text-blue-700 tracking-tight">Admin Paneli</span>
        </div>
        <div className="flex gap-2">
          <SekmeButonu sekmeName="liste" etiket="Anketler" />
          <SekmeButonu sekmeName="olustur" etiket="Anket Oluştur" />
          <SekmeButonu sekmeName="grafikler" etiket="Grafikler" />
          <a href="/api/anketler" className="px-4 py-2 rounded font-semibold transition bg-green-600 text-white hover:bg-green-700">
            Anketlere Git
          </a>
        </div>
      </nav>

      <div className="px-4 pb-12">
        {sekme === "olustur" && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-blue-700 text-center">
              {duzenleId ? "Anketi Düzenle" : "Anket Oluştur"}
            </h1>
            {hata && <div className="text-red-600 mb-2">{hata}</div>}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 bg-white rounded-xl shadow p-6 mb-8 border border-blue-100"
            >
              <input
                className="border border-blue-200 p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Anket Başlığı"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                required
              />
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cokluSecim}
                    onChange={() => setCokluSecim(!cokluSecim)}
                    className="accent-blue-600"
                  />
                  Çoklu Seçim?
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cokluOyIzni}
                    onChange={() => setCokluOyIzni(!cokluOyIzni)}
                    className="accent-blue-600"
                  />
                  Birden Fazla Oy Kullanılsın mı?
                </label>
              </div>

              <div className="flex gap-4">
                <label className="flex-1">
                  Başlangıç Zamanı:
                  <input
                    type="datetime-local"
                    value={baslamaTarihi}
                    onChange={(e) => setBaslamaTarihi(e.target.value)}
                    className="ml-2 border border-blue-200 rounded p-1"
                    required
                  />
                </label>
                <label className="flex-1">
                  Bitiş Zamanı:
                  <input
                    type="datetime-local"
                    value={bitisTarihi}
                    onChange={(e) => setBitisTarihi(e.target.value)}
                    className="ml-2 border border-blue-200 rounded p-1"
                    required
                  />
                </label>
              </div>

              {sorular.map((q, qIdx) => (
                <div key={qIdx} className="border border-blue-100 bg-blue-50 p-3 rounded mb-2">
                  <input
                    className="border border-blue-200 p-1 rounded w-full mb-2"
                    placeholder={`Soru ${qIdx + 1}`}
                    value={q.soruMetni}
                    onChange={(e) => {
                      const guncellenen = [...sorular];
                      guncellenen[qIdx].soruMetni = e.target.value;
                      setSorular(guncellenen);
                    }}
                    required
                  />
                  {q.secenekler.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2 mb-1">
                      <input
                        className="border border-blue-200 p-1 rounded"
                        placeholder={`Seçenek ${oIdx + 1}`}
                        value={opt.metin}
                        onChange={(e) => {
                          const guncellenen = [...sorular];
                          guncellenen[qIdx].secenekler[oIdx].metin = e.target.value;
                          setSorular(guncellenen);
                        }}
                        required
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={opt.aciklamaIzni}
                          onChange={() => {
                            const guncellenen = [...sorular];
                            guncellenen[qIdx].secenekler[oIdx].aciklamaIzni =
                              !guncellenen[qIdx].secenekler[oIdx].aciklamaIzni;
                            setSorular(guncellenen);
                          }}
                          className="accent-blue-600"
                        />
                        Açıklama Alanı Olsun mu?
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => secenekEkle(qIdx)}
                  >
                    + Seçenek Ekle
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-green-600 hover:underline"
                onClick={soruEkle}
              >
                + Soru Ekle
              </button>
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-700 transition"
                >
                  {duzenleId ? "Anketi Güncelle" : "Anketi Oluştur"}
                </button>
                {duzenleId && (
                  <button
                    type="button"
                    className="bg-gray-400 text-white px-4 py-2 rounded font-semibold shadow"
                    onClick={duzenlemeIptal}
                  >
                    İptal
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {sekme === "liste" && (
          <div>
            <h2 className="text-xl font-bold mb-2 text-blue-700">Mevcut Anketler</h2>
            <ul className="space-y-2">
              {anketler.map((anket) => {
                const simdi = new Date();
                let durum = " (Aktif)";
                if (anket.baslamaTarihi && simdi < new Date(anket.baslamaTarihi)) durum = " (Başlamadı)";
                else if (anket.bitisTarihi && simdi > new Date(anket.bitisTarihi)) durum = " (Kapalı)";
                return (
                  <li
                    key={anket._id}
                    className="border border-blue-100 bg-white p-3 rounded flex justify-between items-center shadow-sm hover:shadow transition"
                  >
                    <span>
                      <span className="font-semibold">{anket.baslik}</span>
                      <span className="text-xs text-gray-500">{durum}</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold shadow hover:bg-yellow-600 transition"
                        onClick={() => handleEdit(anket)}
                      >
                        Düzenle
                      </button>
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold shadow hover:bg-red-700 transition"
                        onClick={() => handleDelete(anket._id)}
                      >
                        Sil
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {sekme === "grafikler" && grafikleriGoster()}
      </div>
    </div>
  );
}