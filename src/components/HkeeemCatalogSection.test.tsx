import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const catalogFn = vi.fn();

vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/hkeeem-catalog.functions", () => ({
  getHkeeemCatalog: (args: unknown) => catalogFn(args),
  __esModule: true,
}));

import { HkeeemCatalogSection } from "./HkeeemCatalogSection";

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, refetchOnWindowFocus: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HkeeemCatalogSection />
    </QueryClientProvider>,
  );
}

const catalog = {
  lastUpdatedAt: new Date().toISOString(),
  stale: false,
  offers: [
    { id: "o1", title: "سماعة", purchaseUrl: "https://x.dev", imageUrl: null, storeId: "s1", storeName: "نون", price: 100, originalPrice: 200, discountPercent: 50, category: "إلكترونيات", updatedAt: null },
    { id: "o2", title: "أرز", purchaseUrl: "https://y.dev", imageUrl: null, storeId: "s2", storeName: "أمازون", price: 30, originalPrice: 45, discountPercent: 33, category: "بقالة", updatedAt: null },
  ],
  stores: [
    { id: "s1", name: "نون", description: "متجر", category: "تسوق", logoUrl: null, websiteUrl: "https://noon.com" },
    { id: "s2", name: "أمازون", description: null, category: null, logoUrl: null, websiteUrl: null },
  ],
};

beforeEach(() => catalogFn.mockReset());

describe("قسم عروض HkeeemAI المعتمدة", () => {
  it("يعرض العروض والمتاجر الفعلية", async () => {
    catalogFn.mockResolvedValue(catalog);
    renderSection();
    expect(await screen.findByText("سماعة")).toBeInTheDocument();
    expect(screen.getByText("متاجر HkeeemAI")).toBeInTheDocument();
  });

  it("يصفّي العروض حسب المتجر المستلم", async () => {
    catalogFn.mockResolvedValue(catalog);
    renderSection();
    await screen.findByText("سماعة");
    await userEvent.click(screen.getAllByRole("button", { name: "أمازون" })[0]);
    expect(screen.queryByText("سماعة")).not.toBeInTheDocument();
    expect(screen.getByText("أرز")).toBeInTheDocument();
  });

  it("يعرض حالة فارغة", async () => {
    catalogFn.mockResolvedValue({ ...catalog, offers: [], stores: [] });
    renderSection();
    expect(await screen.findByText("لا توجد عروض معتمدة متاحة حاليًا.")).toBeInTheDocument();
  });

  it("يعرض رسالة عامة وزر إعادة المحاولة عند الفشل", async () => {
    catalogFn.mockRejectedValue(new Error("upstream"));
    const { container } = renderSection();
    const retry = await screen.findByRole("button", { name: "إعادة المحاولة" }, { timeout: 5000 });
    expect(screen.getByRole("alert")).toHaveTextContent("تعذر تحديث عروض حكيم حاليًا، حاول لاحقًا.");
    expect(container.innerHTML).not.toContain("HKEEEM_INTEGRATION_KEY");

    catalogFn.mockResolvedValue(catalog);
    await userEvent.click(retry);
    await waitFor(() => expect(screen.getByText("سماعة")).toBeInTheDocument());
  });

  it("يعرض شارة النسخة المحفوظة عند stale", async () => {
    catalogFn.mockResolvedValue({ ...catalog, stale: true });
    renderSection();
    expect(await screen.findByText(/نسخة محفوظة/)).toBeInTheDocument();
  });
});
