<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { combineExpansions, countryExpansion, glossaryExpansion, useKeywordIndex } from '@metanull/viewer-core'
import { CatalogueResultsView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { SEARCH_FIELDS, databaseResults, searchRows, useSearchFields } from '../composables/catalogue.js'

// The database results run on the platform's composed `CatalogueResultsView`
// (composables/catalogue.js's `databaseResults`): the query in the URL, the
// pages, the summary line and the rows are declared there. What stays this
// wrapper's own is the keyword index itself — a live composable tied to the
// results page's own search language (Decision D3: `rank: 'hits'`, the
// glossary and country expansions), rather than a plain declaration — the
// search-language watch legacy's `database_results.php` ran before it
// searched a language's translations, and the refine row under the summary.

const route = useRoute()
const { loadTranslations } = useInventoryData()
const fieldOptions = useSearchFields()

watch(() => route.query.lang, (lang) => { if (lang) loadTranslations('items', lang) }, { immediate: true })

const index = useKeywordIndex('items', {
  grammar: 'fields',
  fields: SEARCH_FIELDS,
  language: () => route.query.lang || '',
  rank: 'hits',
  expand: combineExpansions(glossaryExpansion(), countryExpansion()),
})

// `index.search` reads the whole `items` entity; `list` already carries
// `databaseResults`'s own `scope` (in-scope items only) by the time `narrow`
// runs — narrowed to the keyword hits inside that set, in the index's own
// ranked order, rather than the reverse (which would lose the rank once
// `list` is filtered again).
function narrow(list, filters) {
  const ids = new Set(list.map((item) => item.id))
  return index.search(searchRows(filters)).filter((item) => ids.has(item.id))
}

const spec = computed(() => ({ ...databaseResults, narrow }))
</script>

<template>
  <CatalogueResultsView :spec="spec" class="mwnf-panel">
    <template #before>
      <h1 class="mwnf-heading">{{ $t('sharinghistory.nav.database') }} — {{ $t('catalogue.results.heading') }}</h1>
    </template>

    <template #actions>
      <RouterLink :to="{ name: 'database' }" class="mwnf-button mwnf-button--secondary small">{{ $t('catalogue.search.newSearch') }}</RouterLink>
    </template>

    <template #filters="{ filters }">
      <select v-model="filters.op4" class="mwnf-select cond">
        <option value="AND">{{ $t('catalogue.search.and') }}</option>
        <option value="OR">{{ $t('catalogue.search.or') }}</option>
      </select>
      <select v-model="filters.field4" class="mwnf-select field">
        <option v-for="f in fieldOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
      </select>
      <input v-model="filters.q4" type="text" class="mwnf-select keyword" :placeholder="$t('catalogue.search.keywordPlaceholder')" />
    </template>

    <template #empty>
      {{ $t('catalogue.results.noResultsSearch') }}
      <RouterLink :to="{ name: 'database' }">{{ $t('catalogue.search.tryNewSearch') }}</RouterLink>
    </template>
  </CatalogueResultsView>
</template>

<style scoped>
/* The refine row's fourth keyword field is this page's own — small enough
   a variant that it stays a one-off on top of the shared button/select. */
.mwnf-button.small { font-size: 12px; padding: 4px 12px; text-decoration: none; }
.mwnf-button.small + .mwnf-button.small { margin-left: 8px; }
.cond { width: 60px; }
.field { width: 200px; }
.keyword { width: 200px; }
</style>
