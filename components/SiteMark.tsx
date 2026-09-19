import Link from "next/link";

export function SiteMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${inverse ? "text-white" : "text-black"}`}
    >
      random.preference
    </Link>
  );
}
