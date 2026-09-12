import React from "react";
import { Building2, TrendingUp, Users, DollarSign, Plus } from "lucide-react";
import { OfficePicks } from "@/components/office/OfficePicks";

export const MyOfficeDashboard: React.FC = () => {
  const stats = [
    { title: "إجمالي العقارات", value: "12", icon: Building2, color: "bg-blue-500" },
    { title: "العروض النشطة", value: "8", icon: TrendingUp, color: "bg-green-500" },
    { title: "طلبات المعاينة", value: "24", icon: Users, color: "bg-purple-500" },
    { title: "إجمالي المبيعات", value: "1.2M ر.س", icon: DollarSign, color: "bg-amber-500" },
  ];

  return (
    <div className="p-6 space-y-6 dir-rtl text-right">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم - مكتبي</h1>
          <p className="text-gray-500 text-sm">إدارة عقاراتك وطلباتك بكل سهولة</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
          <Plus className="w-4 h-4" />
          إضافة عقار جديد
        </button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <h3 className="text-xl font-bold text-gray-800 mt-1">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg text-white ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
