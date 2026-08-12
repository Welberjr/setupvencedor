delete from public.catalog_items item
where item.slug in ('frontend-design', 'context7', 'playwright')
  and not exists (
    select 1
    from public.catalog_item_sources source
    where source.catalog_item_id = item.id
  );
