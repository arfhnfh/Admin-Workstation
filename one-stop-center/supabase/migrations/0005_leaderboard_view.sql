-- ===== LEADERBOARD FUNCTION =================================================
-- Aggregates book loans to show top borrowers with SECURITY DEFINER so that
-- staff can view the leaderboard even though book_loans has restrictive RLS.
-- Matches borrowers by email (borrower_name) to staff_contact.email

create or replace function public.get_library_leaderboard(limit_count integer default 10)
returns table (
  identifier text,
  display_name text,
  avatar_url text,
  books_borrowed bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      coalesce(st.id::text, lower(bl.borrower_name), 'unknown') as identifier,
      coalesce(st.short_name, 
        split_part(bl.borrower_name, '@', 1),
        'Anonymous') as display_name,
      coalesce(st.avatar_url, '') as avatar_url,
      count(*)::bigint as books_borrowed
    from book_loans bl
      left join staff_contact sc on lower(sc.email) = lower(bl.borrower_name)
      left join staff st on st.id = sc.staff_id
    where bl.borrower_name is not null and bl.borrower_name != ''
    group by identifier, display_name, avatar_url
    order by books_borrowed desc
    limit limit_count;
end;
$$;

grant execute on function public.get_library_leaderboard(integer) to anon, authenticated, service_role;

