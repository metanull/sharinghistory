<script setup>
import { computed } from 'vue'
import { I18nText, useI18n } from '@metanull/viewer-core'
import { SectionCards } from '@metanull/viewer-layout/content'
import { historicalProfileCountries, historicalProfileNodeRoute, historicalProfilesTree } from '../composables/history.js'
import { useInventoryData } from '../composables/useInventoryData.js'

const { t } = useI18n()
const { labelOf, mdStrip, tr } = useInventoryData()

// A card links straight to the record's first page — the record's own bare
// address needs the record loaded to resolve to one, which
// HistoricalBackgroundCountry.vue does instead, for a bookmarked address.
const cards = computed(() =>
  [...historicalProfileCountries.value]
    .sort((a, b) => labelOf('countries', a.country_id).localeCompare(labelOf('countries', b.country_id)))
    .map((record) => {
      const firstPage = historicalProfilesTree.children(record.id)[0]
      return {
        title: labelOf('countries', record.country_id),
        image: record.images?.[0]?.url,
        alt: mdStrip(tr('collections', record.id)?.title ?? record.internal_name),
        to: historicalProfileNodeRoute(firstPage ?? record),
      }
    }),
)
</script>

<template>
  <div class="mwnf-panel">
    <h1 class="mwnf-heading">{{ t('sharinghistory.nav.historicalProfiles') }}</h1>
    <I18nText tag="p" class="hb-intro-note" keypath="sharinghistory.profile.intro" />
    <SectionCards :cards="cards" variant="covers" />
  </div>
</template>

<style scoped>
.hb-intro-note {
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 14px;
}
</style>
