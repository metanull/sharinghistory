<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { AppHyperlinks } from '@metanull/viewer-layout'
import { EssayView } from '@metanull/viewer-layout/views'
import { exhibitionIntroductionSpec, relatedContentLinks } from '../composables/exhibitionSpecs.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// "About the Exhibition" (legacy exh_introduction.php): an `EssayView` node
// in its own right — the exhibition collection itself — so back link,
// title, quote/body and the item grid all come from the view's default
// rendering; only the "Related Content" box is this site's own, in `after`.

const route = useRoute()
const { t } = useI18n()
const { timelines } = useInventoryData()

const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))

function relatedLinks(node, text) {
  const hasThematicTimeline = timelines.value.some((timeline) => timeline.collection_id === node.id)
  const bibliography = text.extra?.bibliography
  const hasFurtherReading = !!bibliography && Object.values(bibliography).some((entries) => entries?.length)
  return relatedContentLinks({ exhibitionId: node.id, hasThematicTimeline, hasFurtherReading, t })
}
</script>

<template>
  <EssayView :spec="exhibitionIntroductionSpec" :id="exhibitionId">
    <template #after="{ node, text }">
      <AppHyperlinks :title="t('sharinghistory.related.title')" :links="relatedLinks(node, text)" />
    </template>
  </EssayView>
</template>
