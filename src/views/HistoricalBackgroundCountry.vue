<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { EssayView } from '@metanull/viewer-layout/views'
import { historicalProfilesTree } from '../composables/history.js'
import { historicalBackgroundCountrySpec } from '../composables/historySpecs.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The essay is a page's own narrative (composables/historySpecs.js,
// decision #39). What is the record's, not the page's — its own intro, the
// bibliography, the historical maps — is not a field of the page's
// translation at all, so it is this wrapper's own `before-body`/`after`
// slot content, read off `record` directly rather than off the essay's
// current node.

const props = defineProps({
  recordId: { type: String, required: true },
  pageId: { type: String, default: null },
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { labelOf, md } = useInventoryData()

const record = computed(() => historicalProfilesTree.byId.value.get(props.recordId) ?? null)
const pages = computed(() => (record.value ? historicalProfilesTree.children(record.value.id) : []))

// A bare record address, or a bookmarked `?page=N` one (legacy's own query
// pagination), canonicalised once onto the record's own explicit page
// address — the address `historicalProfileNodeRoute` and every card linking
// here already hand out directly.
watchEffect(() => {
  if (props.pageId || !pages.value.length) return
  const ordinal = Number.parseInt(String(route.query.page ?? '1'), 10)
  const index = Number.isInteger(ordinal) && ordinal >= 1 && ordinal <= pages.value.length ? ordinal - 1 : 0
  router.replace({
    name: 'historical-profile',
    params: { recordId: props.recordId, pageId: pages.value[index].id },
  })
})

const activePageId = computed(() => props.pageId ?? pages.value[0]?.id ?? null)

// The importer injects the same language-keyed bibliography map into every
// translation's own extra, the way exhibitionSpecs.js's own
// `bibliographyLinks` reads it for an exhibition.
function bibliographyMarkdown(tr, language) {
  const bib = tr('collections', record.value.id).extra?.bibliography
  if (!bib) return ''
  const raw = bib[language] ?? bib.en ?? Object.values(bib)[0] ?? null
  if (raw == null) return ''
  if (Array.isArray(raw)) return raw.filter((entry) => typeof entry === 'string').join('\n\n')
  return typeof raw === 'string' ? raw : ''
}
</script>

<template>
  <div v-if="!record" class="mwnf-panel not-found">
    <p>{{ t('sharinghistory.notFound.profile') }}</p>
    <router-link to="/historical-profiles">← {{ t('sharinghistory.profile.returnLink') }}</router-link>
  </div>

  <div v-else-if="activePageId" class="hb-wrap">
    <router-link class="mwnf-back-bar" to="/historical-profiles">← {{ t('sharinghistory.nav.historicalProfiles') }}</router-link>

    <EssayView :spec="historicalBackgroundCountrySpec" :id="activePageId">
      <template #before-body="{ tr }">
        <p v-if="record.country_id" class="hb-country-tag">{{ labelOf('countries', record.country_id) }}</p>
        <div v-if="tr('collections', record.id).description" class="mwnf-prose" v-html="md(tr('collections', record.id).description)" />
      </template>

      <template #after-body="{ node }">
        <div v-if="node.images?.length" class="hb-image-strip">
          <img v-for="(img, idx) in node.images" :key="idx" :src="img.url" :alt="img.alt_text ?? ''" loading="lazy" />
        </div>
      </template>

      <template #after="{ tr, language }">
        <div class="hb-related">
          <h3 class="hb-item-heading">{{ t('sharinghistory.related.title') }}</h3>
          <ul class="hb-related-list">
            <li><router-link to="/historical-background">{{ t('sharinghistory.nav.historicalBackground') }}</router-link></li>
            <li v-if="record.country_id">
              <router-link :to="{ path: '/timeline/results', query: { country: record.country_id, exhibition: 'pc' } }">
                {{ t('sharinghistory.related.politicalContextTimeline') }} {{ labelOf('countries', record.country_id) }}
              </router-link>
            </li>
            <li v-if="bibliographyMarkdown(tr, language)"><a href="#hb-bibliography">{{ t('sharinghistory.history.bibliography') }}</a></li>
            <li v-if="record.images?.length"><a href="#hb-maps">{{ t('sharinghistory.history.viewMaps') }}</a></li>
          </ul>
        </div>

        <div v-if="record.images?.length" id="hb-maps" class="hb-maps">
          <h3 class="hb-item-heading">{{ t('sharinghistory.history.maps') }}</h3>
          <div class="hb-image-strip">
            <img v-for="(img, idx) in record.images" :key="idx" :src="img.url" :alt="img.alt_text ?? ''" loading="lazy" />
          </div>
        </div>

        <div v-if="bibliographyMarkdown(tr, language)" id="hb-bibliography" class="hb-bibliography">
          <h3 class="hb-item-heading">{{ t('sharinghistory.history.bibliography') }}</h3>
          <div class="mwnf-prose" v-html="md(bibliographyMarkdown(tr, language))" />
        </div>
      </template>
    </EssayView>
  </div>

  <p v-else class="mwnf-essay__status">{{ t('core.status.loading') }}</p>
</template>

<style scoped>
.not-found { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; }

.hb-wrap { display: flex; flex-direction: column; gap: 10px; }

.hb-country-tag {
  display: inline-block;
  font-family: 'Roboto', sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #fff;
  background: var(--accent);
  padding: 2px 8px;
  margin-bottom: 8px;
}

.hb-image-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0;
}
.hb-image-strip img {
  height: 120px;
  border: 1px solid var(--border);
  background: var(--tile-bg);
}

.hb-item-heading {
  font-size: 14px;
  font-weight: 500;
  color: var(--heading);
  border-bottom: 1px solid var(--accent-soft);
  padding-bottom: 3px;
  margin-bottom: 8px;
  font-family: 'Roboto', sans-serif;
}

.hb-bibliography { margin-top: 18px; }
.hb-maps { margin-top: 18px; }
.hb-related { margin-top: 18px; }
.hb-related-list {
  list-style: none;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
}
.hb-related-list li { padding: 3px 0; }
.hb-related-list a { color: var(--nav-active); }
</style>
