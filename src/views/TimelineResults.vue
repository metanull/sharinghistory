<script setup>
import { useI18n } from '@metanull/viewer-core'
import { BackLink } from '@metanull/viewer-layout/content'
import { TimelineResultsView } from '@metanull/viewer-layout/views'
import { timelineResults } from '../composables/timeline.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The timeline results are the platform's composed `TimelineResultsView`,
// rendering the spec in composables/timeline.js. What fills the `#before`
// slot is this website's own: the heading, with the active country/period
// filter as a suffix, the way every other results page on this site prints
// it (DatabaseResults.vue, PcList.vue).

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
  <TimelineResultsView :spec="timelineResults" class="mwnf-panel timeline-results">
    <template #before="{ filters }">
      <BackLink label="timeline.nav.backLink" :to="{ name: 'timeline' }" />
      <h1 class="mwnf-heading">
        {{ $t('sharinghistory.nav.timeline') }}
        <span v-if="activeFilterLabel(filters)" class="heading-filter"> — {{ activeFilterLabel(filters) }}</span>
      </h1>
    </template>
  </TimelineResultsView>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }

/* .timeline-results carries no styles of its own now (mwnf-panel supplies
   the box) — kept only as the :deep() scoping hook below. */
.timeline-results :deep(.mwnf-timeline__filters) { margin-bottom: 16px; }

.timeline-results :deep(.mwnf-timeline__media-item) { max-width: 320px; }
.timeline-results :deep(.sh-timeline-see) {
  font-size: 11px;
  font-weight: 500;
  color: var(--nav-active);
  display: block;
}
</style>
