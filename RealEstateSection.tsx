'use client';
import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';

export default function Header() {
  return (
    <div className="bg-black text-white sticky top-0 z-50 border-b border-zinc-800">
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-yellow-400">حكيم</span>
          <span className="text-yellow-400 text-2xl">AI</span>
        </div>

        <div className="flex-1 mx-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن منتج أو عرض..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl py-3 pl-12 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="relative">
            <Bell size={26} />
            <div className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">3</div>
          </div>
          <Menu size={28} />
        </div>
      </div>
    </div>
  );
}









'use client';
import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';

export default function Header() {
  return (
    <div className="bg-black text-white sticky top-0 z-50 border-b border-zinc-800">
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-yellow-400">حكيم</span>
          <span className="text-yellow-400 text-2xl">AI</span>
        </div>

        <div className="flex-1 mx-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن منتج أو عرض..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl py-3 pl-12 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="relative">
            <Bell size={26} />
            <div className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">3</div>
          </div>
          <Menu size={28} />
        </div>
      </div>
    </div>
  );
}









