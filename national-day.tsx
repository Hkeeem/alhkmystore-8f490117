// File: routes/national-day.tsx
// ينشئ صفحة https://yourapp.com/national-day
// الصق هذا الملف كامل في routes/national-day.tsx

import { createFileRoute } from '@tanstack/react-router'
import NationalDay96Launch from '../components/NationalDay96Launch'

export const Route = createFileRoute('/national-day' as any)({
  component: NationalDayPage,
})

function NationalDayPage() {
  return <NationalDay96Launch />
}
