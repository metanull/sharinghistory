<script setup>
import { useI18n } from '@metanull/viewer-core'
import { BackLink } from '@metanull/viewer-layout/content'
import { CatalogueResultsView } from '@metanull/viewer-layout/views'
import { timelineGallery } from '../composables/timeline.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// Decision D1: the timeline gallery of objects legacy's hcr_gallery.php
// offered, regained as the platform's composed `CatalogueResultsView` over
// the spec in composables/timeline.js — scoped to the country and period a
// timeline event's own "See gallery" cross-link is reached from. What fills
// the `#before` slot is this website's own: the heading, with that country
// and period as a suffix.

const { t } = useI18n()
const { labelOf } = useInventoryData()

function activeFilterLabel(filters) {
  const parts = []
  if (filters.country) parts.push(labelOf('countries', filters.country))
  if (filters.begin) parts.push(`${t('catalogue.filter.from')} ${filters.begin}`)
  if (filters.end) parts.push(`${t('catalogue.filter.to')} ${filters.end}`)
  return parts.length ? parts.join(' — ') : null
}
</script>

<template>
  <CatalogueResultsView :spec="timelineGallery" class="mwnf-panel">
    <template #before="{ filters }">
      <BackLink label="timeline.nav.backToEvents" :to="{ name: 'timeline-results', query: filters }" />
      <h1 class="mwnf-heading">
        {{ $t('timeline.results.galleryHeading') }}
        <span v-if="activeFilterLabel(filters)" class="heading-filter"> — {{ activeFilterLabel(filters) }}</span>
      </h1>
    </template>
  </CatalogueResultsView>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
</style>
