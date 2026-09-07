<script setup>
import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
import { FacetSelect } from '@metanull/viewer-layout/content'
import { CatalogueResultsView } from '@metanull/viewer-layout/views'
import { chapterOptions, collectionById, collectionTitle, exhibitionOptions, permanentCollection, themeOptions } from '../composables/catalogue.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The Permanent Collection list is the platform's composed results page,
// rendering the spec in composables/catalogue.js. What is this website's:
// the exhibition cascade — "Theme / Subtheme / Chapter", three dependent
// selects as legacy's pclist_all.php had them, whose options come from the
// exhibition tree rather than a facet, so they render in the view's
// `filters` slot rather than the spec's `controls` — and the heading, the
// section's name with the active filters as a suffix, which legacy printed
// and no other website does.

const { t } = useI18n()
const { labelOf } = useInventoryData()

const exhibitions = computed(() => exhibitionOptions())

// Cascade resets on the visitor's choice only (not on the URL, which sets
// all three together): another exhibition clears theme and chapter, another
// theme clears the chapter — like legacy's dependent selects.
function chooseExhibition(filters, value) {
  filters.exhibition = value
  filters.theme = ''
  filters.chapter = ''
}
function chooseTheme(filters, value) {
  filters.theme = value
  filters.chapter = ''
}

// The heading's suffix: null when nothing is filtered, so it depends on the
// absence of a filter rather than on a comparison against a text. The
// narrowest exhibition-tree level wins: a chapter, else its theme, else the
// exhibition.
function activeFilterLabel(filters) {
  const parts = []
  if (filters.country) parts.push(labelOf('countries', filters.country))
  const scopeId = filters.chapter || filters.theme || filters.exhibition
  const scope = scopeId ? collectionById(scopeId) : null
  if (scope) parts.push(collectionTitle(scope))
  if (filters.partner) parts.push(labelOf('partners', filters.partner))
  if (filters.begin) parts.push(`${t('catalogue.filter.from')} ${filters.begin}`)
  if (filters.end) parts.push(`${t('catalogue.filter.upTo')} ${filters.end}`)
  return parts.length ? parts.join(' — ') : null
}
</script>

<template>
  <CatalogueResultsView :spec="permanentCollection" class="pc-list">
    <template #before="{ filters }">
      <h1 class="section-heading">
        {{ $t('sharinghistory.nav.permanentCollection') }}
        <span v-if="activeFilterLabel(filters)" class="heading-filter"> — {{ activeFilterLabel(filters) }}</span>
      </h1>
    </template>

    <template #filters="{ filters }">
      <FacetSelect
        :model-value="filters.exhibition"
        :label="$t('sharinghistory.filter.theme')"
        :options="exhibitions"
        :any-label="$t('catalogue.facet.any')"
        @update:model-value="(value) => chooseExhibition(filters, value)"
      />
      <FacetSelect
        :model-value="filters.theme"
        :label="$t('sharinghistory.filter.subtheme')"
        :options="themeOptions(filters.exhibition)"
        :any-label="$t('catalogue.facet.any')"
        :disabled="!filters.exhibition"
        @update:model-value="(value) => chooseTheme(filters, value)"
      />
      <FacetSelect
        v-model="filters.chapter"
        :label="$t('sharinghistory.filter.chapter')"
        :options="chapterOptions(filters.exhibition, filters.theme)"
        :any-label="$t('catalogue.facet.any')"
        :disabled="!filters.theme"
      />
    </template>
  </CatalogueResultsView>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
.pc-list :deep(.mwnf-catalogue__filters) { margin-bottom: 16px; }
/* The results in the website's content box, as every section's page is. */
.pc-list :deep(.mwnf-catalogue__body) {
  background: var(--content-bg);
  border: 1px solid var(--border);
  padding: 20px;
  margin-bottom: 16px;
}
.pc-list :deep(.mwnf-facet__select[type='number']) { width: 100px; }
</style>
