import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { listAllBranches, saveBranch, deleteBranch } from "@/lib/branches.functions";
import { stores } from "@/data/deals";
import { toast } from "sonner";

type Row = Awaited<ReturnType<typeof listAllBranches>>[number];

const EMPTY = {
  id: "",
  store_id: stores[0]?.id ?? "",
  store_name: stores[0]?.name ?? "",
  name: "",
  city: "",
  district: "",
  address: "",
  lat: "",
  lng: "",
  phone: "",
  whatsapp: "",
  hours: "",
  balady_url: "",
  maps_url: "",
  image_url: "",
  notes: "",
  is_active: true,
};

export function BranchesPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listAllBranches);
  const save = useServerFn(saveBranch);
  const del = useServerFn(deleteBranch);
  const [form, setForm] = useState({ ...EMPTY });
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["admin-branches"], queryFn: () => list({}) });

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: form.id || null,
          store_id: form.store_id,
          store_name: form.store_name,
          name: form.name,
          city: form.city,
          district: form.district,
          address: form.address,
          lat: Number(form.lat),
          lng: Number(form.lng),
          phone: form.phone,
          whatsapp: form.whatsapp,
          hours: form.hours,
          balady_url: form.balady_url,
          maps_url: form.maps_url,
          image_url: form.image_url,
          notes: form.notes,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      toast.success("تم حفظ الفرع");
      setForm({ ...EMPTY });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
      qc.invalidateQueries({ queryKey: ["real-branches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الفرع");
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
      qc.invalidateQueries({ queryKey: ["real-branches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function edit(r: Row) {
    setForm({
      id: r.id,
      store_id: r.store_id,
      store_name: r.store_name,
      name: r.name,
      city: r.city,
      district: r.district ?? "",
      address: r.address ?? "",
      lat: String(r.lat),
      lng: String(r.lng),
      phone: r.phone ?? "",
      whatsapp: r.whatsapp ?? "",
      hours: r.hours ?? "",
      balady_url: r.balady_url ?? "",
      maps_url: r.maps_url ?? "",
      image_url: (r as { image_url?: string | null }).image_url ?? "",
      notes: r.notes ?? "",
      is_active: r.is_active,
    });
    setOpen(true);
  }

  const field = (key: keyof typeof EMPTY, label: string, placeholder = "") => (
    <label className="text-sm space-y-1 block">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={String(form[key] ?? "")}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">فروع حكيم</h2>
        <button
          onClick={() => {
            setForm({ ...EMPTY });
            setOpen((v) => !v);
          }}
          className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> فرع جديد
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-border bg-card p-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm space-y-1 block">
            <span className="text-muted-foreground">المتجر</span>
            <select
              value={form.store_id}
              onChange={(e) => {
                const s = stores.find((x) => x.id === e.target.value);
                setForm({ ...form, store_id: e.target.value, store_name: s?.name ?? "" });
              }}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {field("name", "اسم الفرع", "حكيم — فرع العليا")}
          {field("city", "المدينة", "الرياض")}
          {field("district", "الحي", "العليا")}
          {field("address", "العنوان الكامل")}
          {field("lat", "خط العرض", "24.71355")}
          {field("lng", "خط الطول", "46.67529")}
          {field("phone", "رقم الهاتف", "0112345678")}
          {field("whatsapp", "واتساب", "0551234567")}
          {field("hours", "أوقات الدوام", "السبت-الخميس ٩ص-١١م")}
          {field("balady_url", "رابط بلدي")}
          {field("maps_url", "رابط الخريطة")}
          {field("image_url", "رابط صورة الفرع")}
          {field("notes", "ملاحظات")}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            فرع نشط ويظهر للزوار
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate()}
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-2"
            >
              {saveMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} حفظ
            </button>
            <button
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-lg border border-border text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">جارِ التحميل…</p>}
      <div className="space-y-2">
        {(data ?? []).map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-card p-3 flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {r.store_name} • {r.city}
                {r.district ? ` • ${r.district}` : ""} {r.is_active ? "" : "• غير نشط"}
              </p>
            </div>
            <button onClick={() => edit(r)} className="p-2 rounded-lg hover:bg-muted">
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => delMut.mutate(r.id)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد فروع مضافة بعد.</p>
        )}
      </div>
    </div>
  );
}
