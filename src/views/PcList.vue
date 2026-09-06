<script setup>
import { computed } from 'vue'
import { dateRange, sortChronological, useFacets, useI18n, useListQuery, usePagination } from '@metanull/viewer-core'
import { FacetSelect, FilterPanel, Pagination, RecordList, ResultsSummary } from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'
import {
  DATE_MODE, FACETS, PAGE_SIZE, chapterOptions, collectionById, collectionTitle, exhibitionOptions, inScope,
  itemIdsUnder, themeOptions,
} from '../composables/catalogue.js'

// The Permanent Collection list: the filters in the URL, read by viewer-core;
// the options from the catalogue spec, over every public record, as legacy
// offered them; the date rule the spec names; chronological order, undated
// last; the rows, the pages and the counts drawn by viewer-layout. What is
// this website's is the exhibition scope — "Theme / Subtheme / Chapter",
// three dependent selects, as legacy's pclist_all.php had them.

const { t } = useI18n()
const { countryLabel, itemLabel, items, mdInline, partnerLabel, partners, tr } = useInventoryData()

const { filters, page, apply, reset, goToPage } = useListQuery({
  keys: ['country', 'exhibition', 'theme', 'chapter', 'partner', 'begin', 'end'],
})

const publicItems = computed(() => (items.value ?? []).filter(inScope))
const options = useFacets(publicItems, FACETS)
const exhibitions = computed(() => exhibitionOptions())
const themes = computed(() => themeOptions(filters.exhibition))
const chapters = computed(() => chapterOptions(filters.exhibition, filters.theme))

// Cascade resets on the visitor's choice only (not on the URL, which sets
// all three together): another exhibition clears theme and chapter, another
// theme clears the chapter — like legacy's dependent selects.
function chooseExhibition(value) {
  filters.exhibition = value
  filters.theme = ''
  filters.chapter = ''
}
function chooseTheme(value) {
  filters.theme = value
  filters.chapter = ''
}

// The narrowest scope wins: a chapter, else its theme, else the exhibition.
const scopeId = computed(() => filters.chapter || filters.theme || filters.exhibition)
const scopeIds = computed(() => (scopeId.value ? itemIdsUnder(scopeId.value) : null))

const results = computed(() => {
  let list = publicItems.value
  if (filters.country) list = list.filter((item) => item.country_id === filters.country)
  if (scopeIds.value) list = list.filter((item) => scopeIds.value.has(item.id))
  if (filters.partner) list = list.filter((item) => item.partner_id === filters.partner)
  list = dateRange(list, { begin: filters.begin, end: filters.end, mode: DATE_MODE })
  return sortChronological(list)
})

const pageInfo = usePagination(results, { page, size: PAGE_SIZE })

// "[N objects, M monuments]", legacy's phrasing of the count.
const summary = computed(() => {
  let objects = 0
  let monuments = 0
  for (const item of results.value) {
    if (item.type === 'monument') monuments++
    else objects++
  }
  return [
    { label: t('catalogue.results.objectsFound'), count: objects },
    { label: t('catalogue.results.monumentsFound'), count: monuments },
  ]
})

const rows = computed(() =>
  pageInfo.value.rows.map((item) => {
    const text = tr('items', item.id)
    return {
      id: item.id,
      image: item.images?.[0]?.url ?? '',
      imageAlt: itemLabel(item),
      name: mdInline(text.name ?? item.internal_name ?? item.id),
      meta: [
        countryLabel(item.country_id),
        text.dates,
        (partners.value ?? []).some((p) => p.id === item.partner_id) ? partnerLabel(item.partner_id) : '',
      ].filter(Boolean),
      badge: item.type,
      to: { name: 'item', params: { id: item.id } },
    }
  }),
)

// The heading's suffix: null when nothing is filtered, so it depends on the
// absence of a filter rather than on a comparison against a text.
const activeFilterLabel = computed(() => {
  const parts = []
  if (filters.country) parts.push(countryLabel(filters.country))
  const scope = scopeId.value ? collectionById(scopeId.value) : null
  if (scope) parts.push(collectionTitle(scope))
  if (filters.partner) parts.push(partnerLabel(filters.partner))
  if (filters.begin) parts.push(`${t('catalogue.filter.from')} ${filters.begin}`)
  if (filters.end) parts.push(`${t('catalogue.filter.upTo')} ${filters.end}`)
  return parts.length ? parts.join(' — ') : null
})
</script>

<template>
  <div>
    <h1 class="section-heading">
      {{ $t('sharinghistory.nav.permanentCollection') }}
      <span v-if="activeFilterLabel" class="heading-filter"> — {{ activeFilterLabel }}</span>
    </h1>

    <FilterPanel class="filters" :title="$t('catalogue.filter.heading')" @apply="apply()" @reset="reset()">
      <FacetSelect v-model="filters.country" :label="$t('catalogue.facet.country')" :options="options.country" :any-label="$t('catalogue.facet.any')" />
      <FacetSelect :model-value="filters.exhibition" :label="$t('sharinghistory.filter.theme')" :options="exhibitions" :any-label="$t('catalogue.facet.any')" @update:model-value="chooseExhibition" />
      <FacetSelect :model-value="filters.theme" :label="$t('sharinghistory.filter.subtheme')" :options="themes" :any-label="$t('catalogue.facet.any')" :disabled="!filters.exhibition" @update:model-value="chooseTheme" />
      <FacetSelect v-model="filters.chapter" :label="$t('sharinghistory.filter.chapter')" :options="chapters" :any-label="$t('catalogue.facet.any')" :disabled="!filters.theme" />
      <FacetSelect v-model="filters.partner" :label="$t('catalogue.facet.holdingInstitution')" :options="options.partner" :any-label="$t('catalogue.facet.any')" />
      <label class="mwnf-facet">
        <span class="mwnf-facet__label">{{ $t('catalogue.facet.fromYear') }}</span>
        <input v-model="filters.begin" type="number" class="year" :placeholder="$t('sharinghistory.filter.fromYearHint')" />
      </label>
      <label class="mwnf-facet">
        <span class="mwnf-facet__label">{{ $t('catalogue.facet.toYear') }}</span>
        <input v-model="filters.end" type="number" class="year" :placeholder="$t('sharinghistory.filter.toYearHint')" />
      </label>
    </FilterPanel>

    <div class="content-box">
      <ResultsSummary :parts="summary" />

      <RecordList :records="rows">
        <template #empty>{{ $t('catalogue.results.noResultsFilter') }}</template>
      </RecordList>

      <Pagination :page-info="pageInfo" :window="7" @navigate="goToPage" />
    </div>
  </div>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
.filters { margin-bottom: 16px; }
.year { width: 100px; }
</style>
