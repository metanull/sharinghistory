<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { EssayView } from '@metanull/viewer-layout/views'
import { exhibitionNodeRoute } from '../composables/exhibitions.js'
import { exhibitionThemeSpec } from '../composables/exhibitionSpecs.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The theme page: the quote, prose and item panel come from `EssayView`'s
// own rendering (composables/exhibitionSpecs.js); the chapter list is this
// site's own, in `after-body` — `tabs` renders the current node's siblings
// (the exhibition's other themes), not its children, so it cannot stand in
// for "this theme's chapters" (see the pull request description).

const route = useRoute()
const themeId = computed(() => decodeURIComponent(route.params.themeId))
const { t } = useI18n()
const { mdInline } = useInventoryData()
</script>

<template>
  <EssayView :spec="exhibitionThemeSpec" :id="themeId">
    <template #after-body="{ node, tree, tr }">
      <nav v-if="tree.children(node.id).length" class="theme-chapters" :aria-label="t('sharinghistory.exhibition.chapters')">
        <h2 class="theme-chapters__heading">{{ t('sharinghistory.exhibition.chapters') }}</h2>
        <router-link
          v-for="(chapter, index) in tree.children(node.id)"
          :key="chapter.id"
          :to="exhibitionNodeRoute(chapter)"
          class="theme-chapters__link"
        >
          <span class="theme-chapters__num">{{ index + 1 }}</span>
          <span class="theme-chapters__name" v-html="mdInline(tr('collections', chapter.id).title ?? chapter.internal_name)" />
          <span v-if="chapter.items?.length" class="theme-chapters__count">{{ chapter.items.length }} {{ t('sharinghistory.results.items') }}</span>
        </router-link>
      </nav>
    </template>
  </EssayView>
</template>

<style scoped>
.theme-chapters { margin-top: 20px; }
.theme-chapters__heading {
  font-size: 16px;
  font-weight: 500;
  color: var(--heading);
  border-bottom: 2px solid var(--accent-soft);
  padding-bottom: 4px;
  margin-bottom: 8px;
  font-family: 'Roboto', sans-serif;
}
.theme-chapters__link {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--border-light);
  text-decoration: none !important;
}
.theme-chapters__link:hover .theme-chapters__name { color: var(--nav-active); }
.theme-chapters__num {
  font-family: 'Roboto Condensed', 'Roboto', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-soft);
  min-width: 20px;
}
.theme-chapters__name {
  flex: 1;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
.theme-chapters__count {
  font-family: 'Roboto', sans-serif;
  font-size: 11px;
  color: var(--muted);
}
</style>
