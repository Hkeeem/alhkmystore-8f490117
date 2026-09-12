import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createDeal,
  deleteDeal,
  fetchDealStats,
  fetchDealViews,
  fetchDeals,
  updateDeal,
} from '../../lib/deals';
import type { Deal, DealInput, DealView } from '../../lib/deals';

export default function AdminDealsManager() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [views, setViews] = useState<DealView[]>([]);
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalClicks: 0,
    totalViews: 0,
    todayViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DealInput>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    clicks_count: 0,
    is_active: true,
    sort_order: 0,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, v, s] = await Promise.all([
        fetchDeals(),
        fetchDealViews(300),
        fetchDealStats(),
      ]);
      setDeals(d);
      setViews(v);
      setStats(s);
    } catch (e: any) {
      setError(e?.message ?? 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      clicks_count: 0,
      is_active: true,
      sort_order: 0,
    });
  };

  const startEdit = (d: Deal) => {
    setEditingId(d.id);
    setForm({
      title: d.title,
      description: d.description ?? '',
      image_url: d.image_url ?? '',
      link_url: d.link_url ?? '',
      clicks_count: d.clicks_count,
      is_active: d.is_active,
      sort_order: d.sort_order,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('عنوان الإعلان مطلوب');
      return;
    }
    try {
      if (editingId) {
        await updateDeal(editingId, form);
      } else {
        await createDeal(form);
      }
      resetForm();
      await loadAll();
    } catch (err: any) {
      setError(err?.message ?? 'تعذّر الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذا الإعلان؟')) return;
    try {
      await deleteDeal(id);
      await loadAll();
    } catch (err: any) {
      setError(err?.message ?? 'تعذّر الحذف');
    }
  };

  const dealName = useMemo(() => {
    const map = new Map<string, string>();
    deals.forEach((d) => map.set(d.id, d.title));
    return map;
  }, [deals]);

  if (loading) return <div dir="rtl" className="admin-loading">تحميل البيانات…</div>;

  return (
    <div dir="rtl" className="admin-deals">
      {error && (
        <div className="admin-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <section className="admin-stats">
        <div className="stat-card">
          <b>{stats.totalDeals}</b>
          <span>إعلان</span>
        </div>
        <div className="stat-card">
          <b>{stats.totalClicks}</b>
          <span>نقرة</span>
        </div>
        <div className="stat-card">
          <b>{stats.totalViews}</b>
          <span>مطالعة</span>
        </div>
        <div className="stat-card">
          <b>{stats.todayViews}</b>
          <span>نشاط اليوم</span>
        </div>
      </section>

      <section className="admin-form">
        <h2>{editingId ? 'تعديل إعلان' : 'إضافة إعلان جديد'}</h2>
        <form onSubmit={handleSubmit}>
          <label>العنوان *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <label>الوصف</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label>رابط الصورة</label>
          <input
            dir="ltr"
            value={form.image_url ?? ''}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://…"
          />

          <label>رابط الإعلان (وجهة النقرة)</label>
          <input
            dir="ltr"
            value={form.link_url ?? ''}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            placeholder="https://…"
          />

          <label>عدد النقرات (إدخال يدوي)</label>
          <input
            type="number"
            min={0}
            value={form.clicks_count ?? 0}
            onChange={(e) => setForm({ ...form, clicks_count: Number(e.target.value) })}
          />

          <label>الترتيب</label>
          <input
            type="number"
            value={form.sort_order ?? 0}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          />

          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            إعلان نشط (يظهر في المعرض)
          </label>

          <div className="form-actions">
            <button type="submit">{editingId ? 'حفظ التعديلات' : 'إضافة الإعلان'}</button>
            {editingId && (
              <button type="button" onClick={resetForm}>
                إلغاء
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-list">
        <h2>الإعلانات ({deals.length})</h2>
        {deals.length === 0 && <p className="empty">لا توجد إعلانات بعد.</p>}
        <table>
          <thead>
            <tr>
              <th>العنوان</th>
              <th>النقرات</th>
              <th>الحالة</th>
              <th>الترتيب</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td>{d.clicks_count}</td>
                <td>{d.is_active ? 'نشط' : 'موقوف'}</td>
                <td>{d.sort_order}</td>
                <td>
                  <button onClick={() => startEdit(d)}>تعديل</button>
                  <button className="danger" onClick={() => handleDelete(d.id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-views">
        <h2>سجل الزيارات والمطالعات ({views.length})</h2>
        {views.length === 0 && <p className="empty">لا نشاط مسجّل بعد.</p>}
        <table>
          <thead>
            <tr>
              <th>النوع</th>
              <th>الإعلان</th>
              <th>الصفحة</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            {views.map((v) => (
              <tr key={v.id}>
                <td>{v.view_type === 'click' ? 'نقرة' : 'مطالعة'}</td>
                <td>{v.deal_id ? dealName.get(v.deal_id) ?? '—' : '—'}</td>
                <td dir="ltr">{v.page_path ?? '—'}</td>
                <td>{new Date(v.viewed_at).toLocaleString('ar-EG')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
