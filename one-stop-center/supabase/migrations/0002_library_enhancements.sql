alter table if exists public.books
  add column if not exists max_loan_days integer default 14,
  add column if not exists qr_code_url text;

alter table if exists public.book_loans
  add column if not exists borrower_name text;

create index if not exists book_loans_copy_idx on public.book_loans(copy_id);

