-- Notes list metadata — avoid shipping full HTML bodies on /notes
alter table public.notes
  add column if not exists preview text not null default '',
  add column if not exists word_count integer not null default 0;

update public.notes
set
  preview = left(
    trim(
      both
      from regexp_replace(
        regexp_replace(coalesce(content, ''), '<[^>]*>', ' ', 'g'),
        E'\\s+',
        ' ',
        'g'
      )
    ),
    280
  ),
  word_count = coalesce(
    (
      select count(*)::integer
      from unnest(
        regexp_split_to_array(
          trim(
            both
            from regexp_replace(
              regexp_replace(coalesce(content, ''), '<[^>]*>', ' ', 'g'),
              E'\\s+',
              ' ',
              'g'
            )
          ),
          E'\\s+'
        )
      ) as w(word)
      where w.word <> ''
    ),
    0
  )
where preview = '' or word_count = 0;
