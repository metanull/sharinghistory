<script setup>
import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
import { SectionCards } from '@metanull/viewer-layout/content'
import { exhibitionList } from '../composables/exhibitions.js'
import { useInventoryData } from '../composables/useInventoryData.js'

const { t } = useI18n()
const { mdStrip, tr } = useInventoryData()

// `SectionCards` interpolates a card's `title` as plain text, so the
// exhibition title is stripped rather than rendered — the same trade-off
// `LinkListView`'s labels make, for the same reason (see the pull request
// description).
const cards = computed(() =>
  exhibitionList.value.map((exhibition) => ({
    title: mdStrip(tr('collections', exhibition.id)?.title ?? exhibition.internal_name),
    to: { name: 'exhibition', params: { exhibitionId: exhibition.id } },
  })),
)
</script>

<template>
  <div v-if="!cards.length" class="mwnf-panel not-found">
    <p>{{ t('sharinghistory.notFound.exhibitions') }}</p>
  </div>

  <div v-else>
    <h1 class="mwnf-heading">{{ t('sharinghistory.nav.exhibitions') }}</h1>
    <p class="intro-text">{{ t('sharinghistory.exhibition.selectPrompt') }}</p>
    <SectionCards :cards="cards" variant="rows" />
  </div>
</template>

<style scoped>
.not-found { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; }

.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}
</style>
