#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS_URL = /^https:\/\/.+/i;

function usage() {
  return `Usage:
  node scripts/import-catalog.mjs --input <file> --check
  node scripts/import-catalog.mjs --input <file> --author-email <email> --output <file>
  node scripts/import-catalog.mjs --input <file> --author-email <email> --stdout`;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) throw new Error(`Argumento invalido: ${value}`);
    const key = value.slice(2);
    if (key === 'check' || key === 'stdout') args[key] = true;
    else {
      const argument = argv[++index];
      if (!argument || argument.startsWith('--')) throw new Error(`Falta valor para --${key}.`);
      args[key] = argument;
    }
  }
  return args;
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlArray(values) {
  return `ARRAY[${values.map(sql).join(', ')}]::text[]`;
}

function onlyKeys(value, path, allowed) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${path}.${key} nao faz parte do formato de importacao.`);
  }
}

function text(value, path, min, max) {
  if (typeof value !== 'string' || value.includes('\0') || value.trim().length < min || value.trim().length > max) {
    throw new Error(`${path} deve ter entre ${min} e ${max} caracteres.`);
  }
  return value.trim();
}

function slug(value, path) {
  const normalized = text(value, path, 1, 80);
  if (!SLUG.test(normalized)) throw new Error(`${path} deve usar slug minusculo com hifens.`);
  return normalized;
}

function taxonomy(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path} e obrigatorio.`);
  onlyKeys(value, path, ['name', 'slug']);
  return { name: text(value.name, `${path}.name`, 1, 80), slug: slug(value.slug, `${path}.slug`) };
}

function tag(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path} e obrigatorio.`);
  onlyKeys(value, path, ['name', 'slug', 'aliases']);
  const base = { name: text(value.name, `${path}.name`, 1, 80), slug: slug(value.slug, `${path}.slug`) };
  const aliases = value.aliases ?? [];
  if (!Array.isArray(aliases)) throw new Error(`${path}.aliases deve ser uma lista.`);
  return { ...base, aliases: [...new Set(aliases.map((alias, index) => text(alias, `${path}.aliases[${index}]`, 1, 80)))] };
}

function registerMetadata(map, names, entry) {
  const previous = map.get(entry.slug);
  if (previous && (previous.name !== entry.name || JSON.stringify(previous.aliases ?? []) !== JSON.stringify(entry.aliases ?? []))) {
    throw new Error(`Metadados conflitantes para o slug ${entry.slug}.`);
  }
  const nameSlug = names.get(entry.name.toLocaleLowerCase('pt-BR'));
  if (nameSlug && nameSlug !== entry.slug) throw new Error(`Nome de metadado duplicado com slugs diferentes: ${entry.name}.`);
  names.set(entry.name.toLocaleLowerCase('pt-BR'), entry.slug);
  map.set(entry.slug, entry);
}

function validateDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('O arquivo deve conter um objeto JSON.');
  onlyKeys(document, 'documento', ['version', 'items']);
  if (document.version !== 1) throw new Error('version deve ser 1.');
  if (!Array.isArray(document.items)) throw new Error('items deve ser uma lista.');

  const seenItems = new Set();
  const categories = new Map();
  const topics = new Map();
  const tags = new Map();
  const categoryNames = new Map();
  const topicNames = new Map();
  const tagNames = new Map();
  const items = document.items.map((raw, index) => {
    const path = `items[${index}]`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${path} deve ser um objeto.`);
    onlyKeys(raw, path, ['title', 'slug', 'category', 'itemType', 'summary', 'ownContent', 'officialUrl', 'instructions', 'topics', 'tags', 'sourceCheckedAt', 'sourceNote']);
    const itemSlug = slug(raw.slug, `${path}.slug`);
    if (seenItems.has(itemSlug)) throw new Error(`Slug duplicado: ${itemSlug}.`);
    seenItems.add(itemSlug);

    const officialUrl = text(raw.officialUrl, `${path}.officialUrl`, 12, 2000);
    let parsedUrl;
    try { parsedUrl = new URL(officialUrl); } catch { throw new Error(`${path}.officialUrl deve ser uma URL valida.`); }
    if (!HTTPS_URL.test(officialUrl) || parsedUrl.protocol !== 'https:' || !parsedUrl.hostname) throw new Error(`${path}.officialUrl deve usar https://.`);
    const checkedAt = text(raw.sourceCheckedAt, `${path}.sourceCheckedAt`, 10, 10);
    const parsedDate = new Date(`${checkedAt}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedAt) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== checkedAt) {
      throw new Error(`${path}.sourceCheckedAt deve ser uma data YYYY-MM-DD valida.`);
    }

    const category = taxonomy(raw.category, `${path}.category`);
    if (!Array.isArray(raw.topics ?? []) || !Array.isArray(raw.tags ?? [])) throw new Error(`${path}.topics e ${path}.tags devem ser listas.`);
    const itemTopics = (raw.topics ?? []).map((entry, child) => taxonomy(entry, `${path}.topics[${child}]`));
    const itemTags = (raw.tags ?? []).map((entry, child) => tag(entry, `${path}.tags[${child}]`));

    registerMetadata(categories, categoryNames, category);
    for (const entry of itemTopics) registerMetadata(topics, topicNames, entry);
    for (const entry of itemTags) registerMetadata(tags, tagNames, entry);

    return {
      title: text(raw.title, `${path}.title`, 3, 160), slug: itemSlug, category,
      itemType: text(raw.itemType, `${path}.itemType`, 2, 60),
      summary: text(raw.summary, `${path}.summary`, 20, 500),
      ownContent: text(raw.ownContent, `${path}.ownContent`, 20, 20000),
      officialUrl, instructions: text(raw.instructions, `${path}.instructions`, 10, 10000),
      topics: itemTopics, tags: itemTags, sourceCheckedAt: checkedAt,
      sourceNote: text(raw.sourceNote, `${path}.sourceNote`, 10, 500),
    };
  });

  return { items, categories: [...categories.values()], topics: [...topics.values()], tags: [...tags.values()] };
}

function generateSql(data, authorEmail) {
  const lines = [
    '-- Generated by scripts/import-catalog.mjs. Do not edit manually.',
    '-- Source metadata only: prose in this file is original to Setup Vencedor.',
    'begin;',
    '',
    'do $$',
    'declare',
    '  catalog_author uuid;',
    'begin',
    `  select profile.id into catalog_author from public.profiles profile join public.user_roles role on role.user_id = profile.id and role.role in ('admin', 'manager') where profile.state = 'active' and profile.email_normalized = ${sql(authorEmail.toLowerCase())} order by profile.created_at asc limit 1;`,
    "  if catalog_author is null then raise exception 'active administrator or manager not found for catalog import'; end if;",
  ];

  for (const category of data.categories) lines.push(`  insert into public.categories (name, slug) values (${sql(category.name)}, ${sql(category.slug)}) on conflict (slug) do update set name = excluded.name;`);
  for (const topic of data.topics) lines.push(`  insert into public.topics (name, slug) values (${sql(topic.name)}, ${sql(topic.slug)}) on conflict (slug) do update set name = excluded.name;`);
  for (const itemTag of data.tags) lines.push(`  insert into public.tags (name, slug, aliases) values (${sql(itemTag.name)}, ${sql(itemTag.slug)}, ${sqlArray(itemTag.aliases)}) on conflict (slug) do update set name = excluded.name, aliases = excluded.aliases;`);

  for (const item of data.items) {
    lines.push(`  -- ${item.slug}: fonte publica verificada em ${item.sourceCheckedAt}; ${item.sourceNote.replace(/[\r\n]+/g, ' ')}`);
    lines.push(`  insert into public.catalog_items (category_id, author_id, title, slug, item_type, summary, own_content, official_url, instructions, status, published_at)`);
    lines.push(`  select category.id, catalog_author, ${sql(item.title)}, ${sql(item.slug)}, ${sql(item.itemType)}, ${sql(item.summary)}, ${sql(item.ownContent)}, ${sql(item.officialUrl)}, ${sql(item.instructions)}, 'published', now() from public.categories category where category.slug = ${sql(item.category.slug)}`);
    lines.push(`  on conflict (slug) do update set category_id = excluded.category_id, title = excluded.title, item_type = excluded.item_type, summary = excluded.summary, own_content = excluded.own_content, official_url = excluded.official_url, instructions = excluded.instructions, status = 'published', published_at = coalesce(public.catalog_items.published_at, now()), archived_at = null;`);
    lines.push(`  delete from public.catalog_item_topics where catalog_item_id = (select id from public.catalog_items where slug = ${sql(item.slug)});`);
    for (const topic of item.topics) lines.push(`  insert into public.catalog_item_topics (catalog_item_id, topic_id) select item.id, topic.id from public.catalog_items item join public.topics topic on topic.slug = ${sql(topic.slug)} where item.slug = ${sql(item.slug)} on conflict do nothing;`);
    lines.push(`  delete from public.catalog_item_tags where catalog_item_id = (select id from public.catalog_items where slug = ${sql(item.slug)});`);
    for (const itemTag of item.tags) lines.push(`  insert into public.catalog_item_tags (catalog_item_id, tag_id) select item.id, tag.id from public.catalog_items item join public.tags tag on tag.slug = ${sql(itemTag.slug)} where item.slug = ${sql(item.slug)} on conflict do nothing;`);
  }

  lines.push('end $$;', 'commit;', '');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input || (!args.check && !args.output && !args.stdout) || (args.output && args.stdout) || (args.check && (args.output || args.stdout)) || (!args.check && !args['author-email'])) {
    throw new Error(usage());
  }
  const raw = await readFile(resolve(args.input), 'utf8');
  const document = JSON.parse(raw.replace(/^\uFEFF/, ''));
  const data = validateDocument(document);
  if (args.check) {
    console.log(`Validacao concluida: ${data.items.length} item(ns), ${data.categories.length} categoria(s), ${data.tags.length} tag(s).`);
    return;
  }
  const authorEmail = text(args['author-email'], '--author-email', 3, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) throw new Error('--author-email deve ser um e-mail valido.');
  const generated = generateSql(data, authorEmail);
  if (args.stdout) process.stdout.write(generated);
  else {
    await writeFile(resolve(args.output), generated, 'utf8');
    console.log(`SQL gerado: ${args.output} (${data.items.length} item(ns)).`);
  }
}

main().catch((error) => {
  console.error(`Erro de importacao: ${error.message}`);
  process.exitCode = 1;
});
