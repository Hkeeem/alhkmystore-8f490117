import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const offersFn = vi.fn();
const storesFn = vi.fn();

vi.mock("@tanstack/react-start", () => ({
  useServerFn: (fn: unknown) => fn,
}));

vi.mock("@/lib/hkeeem-offers.functions", () => ({
  getHkeeemOffers: (args: unknown) => offersFn(args),
  getHkeeemStores: (args: unknown) => storesFn(args),
}));

import { HkeeemOffersSection } from "./HkeeemOffersSection";

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HkeeemOffersSection />
    </QueryClientProvider>,
  );
}

const offer = {
  id: "1",
  title: "سماعة لاسلكية",
  purchaseUrl: "https://example.com/buy",
  imageUrl: null,
  storeName: "متجر حكيم",
  storeId: "s1",
  price: 100,
  originalPrice: 200,
  discountPercent: 50,
  savingsScore: 9,
  category: "إلكترونيات",
  platform: "noon",
};

beforeEach(() => {
  offersFn.mockReset();
  storesFn.mockReset();
  storesFn.mockResolvedValue([]);
});

afterEach(() => vi.clearAllMocks());

describe("HkeeemOffersSection", () => {
  it("يعرض حالة التحميل ثم البطاقات والفلاتر", async () => {
    offersFn.mockResolvedValue([offer]);
    const { container } = renderSection();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();

    expect(await screen.findByText("سماعة لاسلكية")).toBeTruthy();
    expect(screen.getByText("متجر حكيم")).toBeTruthy();
    expect(screen.getByText("خصم 50%")).toBeTruthy();
    expect(screen.getByText("درجة التوفير 9")).toBeTruthy();
    // فلاتر الفئة والمنصة
    expect(screen.getAllByRole("button", { name: "إلكترونيات" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "noon" }).length).toBeGreaterThan(0);
  });

  it("يفتح رابط الشراء في نافذة جديدة بأمان", async () => {
    offersFn.mockResolvedValue([offer]);
    renderSection();
    const link = (await screen.findByText("شراء مباشر")).closest("a")!;
    expect(link.getAttribute("href")).toBe("https://example.com/buy");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("يعرض حالة فارغة عند عدم وجود عروض", async () => {
    offersFn.mockResolvedValue([]);
    renderSection();
    expect(await screen.findByText(/لا توجد عروض مطابقة/)).toBeTruthy();
  });

  it("يعرض خطأ مع زر إعادة المحاولة ولا يكشف المفتاح", async () => {
    offersFn.mockRejectedValue(new Error("تعذّر الاتصال بمنصة حكيم."));
    const { container } = renderSection();
    const retry = await screen.findByRole("button", { name: "إعادة المحاولة" });
    expect(container.innerHTML).not.toContain("HKEEEM_INTEGRATION_KEY");

    offersFn.mockResolvedValue([offer]);
    await userEvent.click(retry);
    await waitFor(() => expect(screen.getByText("سماعة لاسلكية")).toBeTruthy());
  });

  it("يمرر الفلتر إلى الدالة الخادمية عند الاختيار", async () => {
    offersFn.mockResolvedValue([offer]);
    renderSection();
    const chip = (await screen.findAllByRole("button", { name: "إلكترونيات" }))[0];
    await userEvent.click(chip);
    await waitFor(() =>
      expect(offersFn).toHaveBeenCalledWith({ data: expect.objectContaining({ category: "إلكترونيات" }) }),
    );
  });
});
