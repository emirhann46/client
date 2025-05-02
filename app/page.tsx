import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-screen">
      <Link
        href="/admin"
        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg py-4 px-8 transition-colors"
      >
        Admin İşlemleri İçin Tıklayın
      </Link>

      <Link
        href="/api/anketler"
        className="rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-lg py-4 px-8 transition-colors"
      >
        Anketleri Görüntülemek İçin Tıklayın
      </Link>
    </div>
  );
}
