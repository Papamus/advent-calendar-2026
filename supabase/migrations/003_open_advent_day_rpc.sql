CREATE OR REPLACE FUNCTION public.mark_advent_day_opened(p_day_number INT)
RETURNS TABLE (opened_at TIMESTAMPTZ)
LANGUAGE SQL
AS $$
  UPDATE public.advent_days
  SET opened_at = COALESCE(advent_days.opened_at, NOW())
  WHERE advent_days.day_number = p_day_number
  RETURNING advent_days.opened_at;
$$;

REVOKE ALL ON FUNCTION public.mark_advent_day_opened(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_advent_day_opened(INT) TO service_role;
