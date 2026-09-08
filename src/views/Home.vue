<script setup>
import { computed } from 'vue'
import { I18nText, useFeaturedRecord, useI18n } from '@metanull/viewer-core'
import { FeaturedRecord, SectionCards } from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'
import { inScope } from '../composables/catalogue.js'

// The landing page: the welcome, the seven sections as cards, and one item
// on display. The pick and the grid are the platform's; which sections, in
// what words, is this website's — every text written out so the check that
// every name resolves can read it.

const { t } = useI18n()
const { labelOf, mdInline, tr } = useInventoryData()

const cards = computed(() => [
  { title: t('sharinghistory.nav.permanentCollection'), description: t('sharinghistory.home.permanentCollectionText'), action: t('core.action.browse'), to: { name: 'permanent-collection' } },
  { title: t('sharinghistory.nav.database'), description: t('sharinghistory.home.databaseText'), action: t('core.action.search'), to: { name: 'database' } },
  { title: t('sharinghistory.nav.timeline'), description: t('sharinghistory.home.timelineText'), action: t('core.action.explore'), to: { name: 'timeline' } },
  { title: t('sharinghistory.nav.partners'), description: t('sharinghistory.home.partnersText'), action: t('core.action.browse'), to: { name: 'partners' } },
  { title: t('sharinghistory.nav.exhibitions'), description: t('sharinghistory.home.exhibitionsText'), action: t('core.action.explore'), to: { name: 'exhibitions' } },
  { title: t('sharinghistory.nav.historicalBackground'), description: t('sharinghistory.home.historicalBackgroundText'), action: t('core.action.read'), to: { name: 'historical-background' } },
  { title: t('sharinghistory.nav.historicalProfiles'), description: t('sharinghistory.home.historicalProfilesText'), action: t('core.action.browse'), to: { name: 'historical-profiles' } },
])

// One public item with an image, picked once per visit: the records legacy
// kept only to illustrate the Historical Background are not on display.
const pick = useFeaturedRecord('items')
const featured = computed(() => (pick.value && inScope(pick.value) ? pick.value : null))
const featuredText = computed(() => (featured.value ? tr('items', featured.value.id) : {}))
</script>

<template>
  <div class="home">
    <div class="home-banner mwnf-panel">
      <h1 class="home-title">{{ $t('sharinghistory.home.title') }}</h1>
      <I18nText tag="p" class="home-intro" keypath="sharinghistory.home.intro" />
    </div>

    <SectionCards :cards="cards" />

    <FeaturedRecord
      v-if="featured"
      class="mwnf-panel"
      :heading="$t('sharinghistory.home.itemOnDisplay')"
      :image="featured.images?.[0]?.url ?? ''"
      :image-alt="labelOf('items', featured.id)"
      :eyebrow="featured.type"
      :name="mdInline(featuredText.name ?? featured.internal_name ?? featured.id)"
      :meta="[featuredText.location, featuredText.dates].filter(Boolean)"
      :action="$t('core.action.viewDetails')"
      :to="{ name: 'item', params: { id: featured.id } }"
    />
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 16px; }
.home-banner { border-top: 3px solid var(--accent); }
.home-title {
  font-size: 20px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 10px;
}
.home-intro {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  max-width: 680px;
}
</style>
