import Link from "next/link";

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    currentPage,
    totalPages,
    pageItems: items.slice(start, start + pageSize),
    totalItems: items.length,
  };
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  params,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function href(page: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) search.set(key, value);
    }
    search.set("page", String(page));
    return `${basePath}?${search.toString()}`;
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <Link className={`button ${currentPage === 1 ? "disabled" : ""}`} href={href(Math.max(1, currentPage - 1))} aria-disabled={currentPage === 1}>
        Previous
      </Link>
      <span className="muted">
        Page {currentPage} of {totalPages}
      </span>
      <Link
        className={`button ${currentPage === totalPages ? "disabled" : ""}`}
        href={href(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
      >
        Next
      </Link>
    </nav>
  );
}
