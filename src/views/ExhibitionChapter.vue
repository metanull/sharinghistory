<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { EssayView } from '@metanull/viewer-layout/views'
import { curatorJustification, exhibitionChapterSpec, partnerJustification } from '../composables/exhibitionSpecs.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The chapter page: the essay, the picture panel (with its detail
// photographs) and previous/next crossing into the next theme all come from
// `EssayView` itself (composables/exhibitionSpecs.js, decision D2). What the
// default panel does not carry — the curator/partner justifications, the
// see-also and further-reading blocks — are this site's own, in the
// `justifications` and `after-body` slots.

const route = useRoute()
const chapterId = computed(() => decodeURIComponent(route.params.chapterId))
const { t } = useI18n()
const { md, mdInline } = useInventoryData()
</script>

<template>
  <EssayView :spec="exhibitionChapterSpec" :id="chapterId">
    <template #justifications="{ node, selected, language }">
      <p v-if="curatorJustification(selected, node, language)" class="chapter-justification">
        <span class="chapter-justification__label">{{ t('sharinghistory.exhibition.curatorJustification') }}</span>
        <span v-html="mdInline(curatorJustification(selected, node, language))" />
      </p>
      <p v-if="partnerJustification(selected, node, language)" class="chapter-justification">
        <span class="chapter-justification__label">{{ t('sharinghistory.exhibition.partnerJustification') }}</span>
        <span v-html="mdInline(partnerJustification(selected, node, language))" />
      </p>
    </template>

    <template #after-body="{ text }">
      <div v-if="text.extra?.see_also_links" class="chapter-extra">
        <h3 class="chapter-extra__heading">{{ t('sharinghistory.exhibition.seeAlso') }}</h3>
        <div class="prose" v-html="md(text.extra.see_also_links)" />
      </div>
      <div v-if="text.extra?.further_reading" class="chapter-extra">
        <h3 class="chapter-extra__heading">{{ t('exhibition.relatedCategory.furtherReading') }}</h3>
        <div class="prose" v-html="md(text.extra.further_reading)" />
      </div>
    </template>
  </EssayView>
</template>

<style scoped>
.chapter-justification {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  font-family: 'Roboto', sans-serif;
}
.chapter-justification__label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-soft);
  margin-bottom: 2px;
}

.chapter-extra { margin-top: 18px; }
.chapter-extra__heading {
  font-size: 14px;
  font-weight: 500;
  color: var(--heading);
  border-bottom: 1px solid var(--accent-soft);
  padding-bottom: 3px;
  margin-bottom: 6px;
  font-family: 'Roboto', sans-serif;
}
.prose { font-size: 14px; line-height: 1.7; color: var(--text); font-family: 'Roboto', sans-serif; }
.prose :deep(p) { margin: 0 0 .75em; }
.prose :deep(p:last-child) { margin-bottom: 0; }
</style>
