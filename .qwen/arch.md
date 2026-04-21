# System Architecture

## Технологический стек
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons.
- **UI Components**: shadcn/ui.
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Edge Functions).
- **Data Export**: `xlsx` (SheetJS).
- **Charts**: Recharts.

## Структура базы данных (Supabase)
1.  **profiles**: `id, full_name, role (teacher/student), legal_accepted_at, created_at`.
2.  **classes**: `id, name, teacher_id, invite_code (unique)`.
3.  **class_members**: `class_id, student_id (fk to profiles)`.
4.  **tests**: 
    - `id, teacher_id, title, description`
    - `grading_scale`: JSONB (например: `{"5": 90, "4": 75, "3": 50, "2": 0}`)
    - `settings`: JSONB (time_limit, show_hints).
5.  **questions**: `id, test_id, type (choice, multi, text, info_block), content, correct_answer, points, order_index`.
6.  **results**: `id, test_id, student_id, raw_score, total_possible, percentage, final_grade, finished_at`.

## Формула расчета
Система вычисляет результат автоматически:
$$P = \left( \frac{\text{Набранные баллы}}{\text{Макс. баллы}} \right) \times 100$$
Затем $P$ сопоставляется с `grading_scale` теста для определения итоговой оценки.