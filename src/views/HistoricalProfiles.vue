<script setup>
import { computed } from 'vue'
import { I18nText } from '@metanull/viewer-core'
import { useInventoryData } from '../composables/useInventoryData.js'

const {
  historicalBackgroundProfiles,
  labelOf,
  mdInline,
  tr,
} = useInventoryData()

// Country profiles, alphabetical by English country name (legacy nav order).
const profiles = computed(() =>
  [...historicalBackgroundProfiles.value].sort((a, b) =>
    labelOf('countries', a.country_id).localeCompare(labelOf('countries', b.country_id))
  )
)

function profileTitle(record) {
  return tr('collections', record.id)?.title ?? record.internal_name
}
</script>

<template>
  <div class="content-box">
    <h1 class="section-heading">{{ $t('sharinghistory.nav.historicalProfiles') }}</h1>
    <I18nText tag="p" class="hb-intro-note" keypath="sharinghistory.profile.intro" />
    <div class="hb-country-grid">
      <RouterLink
        v-for="record in profiles"
        :key="record.id"
        :to="`/historical-profiles/${encodeURIComponent(record.id)}`"
        class="hb-country-card"
      >
        <img
          v-if="record.images?.length"
          :src="record.images[0].url"
          :alt="labelOf('countries', record.country_id)"
          class="hb-country-img"
          loading="lazy"
        />
        <div v-else class="hb-country-img hb-country-img-placeholder" />
        <span class="hb-country-name">{{ labelOf('countries', record.country_id) }}</span>
        <span class="hb-country-title" v-html="mdInline(profileTitle(record))" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.hb-intro-note {
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 14px;
}

.hb-country-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}
.hb-country-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-decoration: none !important;
}
.hb-country-card:hover .hb-country-name { color: var(--nav-active); }
.hb-country-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border: 1px solid var(--border);
  background: var(--tile-bg);
  display: block;
}
.hb-country-name {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--heading);
}
.hb-country-title {
  font-family: 'Roboto', sans-serif;
  font-size: 11px;
  color: var(--muted);
}
</style>
