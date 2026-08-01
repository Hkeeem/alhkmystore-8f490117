import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const KEY = "hkeeem-theme";

const themeClass = () =>
  Array.from(document.documentElement.classList).find((c) =>
    ["theme-gold", "theme-silver", "theme-bronze"].includes(c),
  );

const swatch = (label: string) => screen.getByRole("button", { name: label });
const group = () => screen.getByRole("group", { name: "نمط الألوان" });

async function mount() {
  await act(async () => {
    render(<ThemeSwitcher />);
  });
}

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    localStorage.setItem(KEY, "gold");
    document.documentElement.className = "";
  });

  it("يعرض معاينة الثيم دون حفظه", async () => {
    await mount();
    fireEvent.mouseEnter(swatch("الوضع الفضي"));

    expect(themeClass()).toBe("theme-silver");
    expect(localStorage.getItem(KEY)).toBe("gold");
  });

  it("تبقى المعاينة ثابتة أثناء التنقل بين الأزرار", async () => {
    await mount();
    fireEvent.mouseEnter(swatch("الوضع الفضي"));
    fireEvent.mouseEnter(swatch("الوضع البرونزي"));

    expect(themeClass()).toBe("theme-bronze");
    expect(localStorage.getItem(KEY)).toBe("gold");

    // الانتقال بالتركيز داخل المجموعة لا يُرجع الثيم المحفوظ
    fireEvent.focus(swatch("الوضع الفضي"));
    fireEvent.blur(group(), { relatedTarget: swatch("الوضع البرونزي") });

    expect(themeClass()).toBe("theme-silver");
    expect(localStorage.getItem(KEY)).toBe("gold");
  });

  it("يظهر زر التأكيد للثيم المعاين فقط ويحفظ عند الضغط", async () => {
    await mount();
    expect(screen.queryByRole("button", { name: /تأكيد/ })).toBeNull();

    fireEvent.mouseEnter(swatch("الوضع البرونزي"));
    const confirm = screen.getByRole("button", { name: /تأكيد/ });

    await act(async () => {
      fireEvent.click(confirm);
    });

    expect(localStorage.getItem(KEY)).toBe("bronze");
    expect(themeClass()).toBe("theme-bronze");
    expect(screen.queryByRole("button", { name: /تأكيد/ })).toBeNull();
  });

  it("لا يظهر زر التأكيد عند معاينة الثيم المحفوظ نفسه", async () => {
    await mount();
    fireEvent.mouseEnter(swatch("الوضع الذهبي"));

    expect(screen.queryByRole("button", { name: /تأكيد/ })).toBeNull();
  });

  it("يرجع للثيم المحفوظ عند مغادرة المبدّل بدون تأكيد", async () => {
    await mount();
    fireEvent.mouseEnter(swatch("الوضع الفضي"));
    expect(themeClass()).toBe("theme-silver");

    fireEvent.mouseLeave(group());

    expect(themeClass()).toBe("theme-gold");
    expect(localStorage.getItem(KEY)).toBe("gold");
    expect(screen.queryByRole("button", { name: /تأكيد/ })).toBeNull();
  });

  it("يرجع للثيم المحفوظ عند خروج التركيز خارج المبدّل", async () => {
    await mount();
    fireEvent.focus(swatch("الوضع البرونزي"));
    expect(themeClass()).toBe("theme-bronze");

    fireEvent.blur(group(), { relatedTarget: document.body });

    expect(themeClass()).toBe("theme-gold");
    expect(localStorage.getItem(KEY)).toBe("gold");
  });
});
