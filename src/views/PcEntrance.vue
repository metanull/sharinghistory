<script setup>
import { computed } from 'vue'
import { I18nText, useFacets } from '@metanull/viewer-core'
import { SearchFormView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { FACETS, exhibitionOptions } from '../composables/catalogue.js'

// The Permanent Collection entrance: one filter at a time, chosen by a
// radio, as legacy's form was (decision D2) — `SearchFormView`'s `radio`
// mode over the same facet values the results page itself offers
// (`FACETS`, composables/catalogue.js): a country or holding institution a
// visible item does not carry is not offered. The theme radio stays this
// site's own — an exhibition, not a record field, so it reads the
// exhibition tree rather than a facet derivation — and writes the
// `exhibition` key the results page's own scope reads (composables/catalogue.js).

// `items` is already the visible set — display_status 'N' items excluded,
// declared once as `visible.items` in useInventoryData.js — so the facet
// options here already match what the results page will show.
const { items } = useInventoryData()
const options = useFacets(items, FACETS)

const pcSearch = computed(() => ({
  mode: 'radio',
  target: 'permanent-collection-results',
  facets: [
    { key: 'country', label: 'catalogue.facet.country', options: options.value.country ?? [] },
    { key: 'exhibition', label: 'sharinghistory.filter.theme', options: exhibitionOptions() },
    { key: 'partner', label: 'catalogue.facet.holdingInstitution', options: options.value.partner ?? [] },
    { key: 'begin', label: 'catalogue.facet.startDate', type: 'year' },
    { key: 'end', label: 'catalogue.facet.endDate', type: 'year' },
  ],
}))
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('sharinghistory.nav.permanentCollection') }}</h1>

    <div class="content-box">
      <SearchFormView :spec="pcSearch">
        <template #intro>
          <I18nText tag="p" class="intro-text" keypath="sharinghistory.pc.intro" />
        </template>
      </SearchFormView>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
}
</style>
