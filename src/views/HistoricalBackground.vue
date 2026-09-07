<script setup>
import { ref, computed } from 'vue'
import { I18nText, useI18n } from '@metanull/viewer-core'
import {
  historicalPerspectives,
  historicalProfileCountries,
  historicalProfileNodeRoute,
  historicalProfilesTree,
  historicalTopics,
} from '../composables/history.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// None of `TextPageView` (a single Markdown body, no slots of its own) or
// `SectionCards` (one link per card) fits this page's three boxes: the
// perspective tabs switch prose in place rather than navigating, the topic
// list has nowhere to link to (legacy never filled the "read more" popup
// text in), and the country table carries two links per row. A small
// wrapper of its own, over the two `useCollectionTree` subtrees in
// composables/history.js, the way ExhibitionSplash.vue is a wrapper over
// the exhibition tree for the same reason (see the pull request
// description).

const { t } = useI18n()
const { labelOf, md, mdInline, tr } = useInventoryData()

const activePerspectiveIndex = ref(0)

const perspectives = computed(() =>
  historicalPerspectives.value.map((p) => ({
    id: p.id,
    title: tr('collections', p.id)?.title ?? p.internal_name,
    description: tr('collections', p.id)?.description ?? '',
  })),
)

const activePerspective = computed(() => perspectives.value[activePerspectiveIndex.value] ?? null)

// "Read more" topics: legacy never filled their texts in, so this stays a
// plain list — exactly as much content as legacy had.
const topics = computed(() =>
  historicalTopics.value.map((topic) => ({
    id: topic.id,
    title: tr('collections', topic.id)?.title ?? topic.internal_name,
  })),
)

// Country Insight: direct access to each country's Historical Profile and
// Political Context timeline, alphabetical by (English) country name.
const insightCountries = computed(() =>
  [...historicalProfileCountries.value]
    .map((record) => ({
      record,
      name: labelOf('countries', record.country_id),
      profileRoute: historicalProfileNodeRoute(historicalProfilesTree.children(record.id)[0] ?? record),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
)
</script>

<template>
  <div class="hb-wrap">
    <div class="content-box">
      <h1 class="section-heading">{{ t('sharinghistory.nav.historicalBackground') }}</h1>
      <I18nText tag="p" class="hb-intro-note" keypath="sharinghistory.history.intro" />

      <div v-if="perspectives.length" class="perspective-tabs">
        <button
          v-for="(p, idx) in perspectives"
          :key="p.id"
          class="perspective-tab"
          :class="{ active: idx === activePerspectiveIndex }"
          @click="activePerspectiveIndex = idx"
        >{{ p.title }}</button>
      </div>

      <div v-if="activePerspective">
        <h2 class="perspective-title" v-html="mdInline(activePerspective.title)" />
        <div class="prose" v-html="md(activePerspective.description)" />
      </div>
    </div>

    <div v-if="topics.length" class="content-box">
      <h2 class="section-heading">{{ t('sharinghistory.action.readMore') }}</h2>
      <ul class="topic-list">
        <li v-for="topic in topics" :key="topic.id" class="topic-row">
          <span class="topic-name" v-html="mdInline(topic.title)" />
        </li>
      </ul>
    </div>

    <div class="content-box">
      <h2 class="section-heading">{{ t('sharinghistory.history.countryInsight') }}</h2>
      <I18nText tag="p" class="hb-intro-note" keypath="sharinghistory.history.countryInsightIntro" />
      <table class="insight-table">
        <tbody>
          <tr v-for="c in insightCountries" :key="c.record.id">
            <th>{{ c.name }}</th>
            <td>
              <RouterLink :to="c.profileRoute">
                {{ t('sharinghistory.related.historicalProfile') }}
              </RouterLink>
            </td>
            <td>
              <RouterLink
                :to="{ path: '/timeline/results', query: { country: c.record.country_id, exhibition: 'pc' } }"
              >
                {{ t('sharinghistory.related.politicalContextTimeline') }}
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.hb-wrap { display: flex; flex-direction: column; gap: 16px; }

.hb-intro-note {
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 14px;
}

.perspective-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
}
.perspective-tab {
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  background: none;
  border: 1px solid var(--border);
  color: var(--heading);
  cursor: pointer;
}
.perspective-tab:hover { color: var(--nav-active); border-color: var(--accent); }
.perspective-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.perspective-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--heading);
  margin-bottom: 10px;
  font-family: 'Roboto', sans-serif;
}

.prose { font-size: 14px; line-height: 1.7; color: var(--text); font-family: 'Roboto', sans-serif; }
.prose :deep(p) { margin: 0 0 .75em; }

.topic-list { list-style: none; }
.topic-row {
  padding: 8px 4px;
  border-bottom: 1px solid var(--border-light);
}
.topic-row:last-child { border-bottom: none; }
.topic-name {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  color: var(--heading);
}

.insight-table { border-collapse: collapse; width: 100%; font-family: 'Roboto', sans-serif; font-size: 13px; }
.insight-table th {
  text-align: left;
  font-weight: 500;
  color: var(--heading);
  padding: 7px 16px 7px 4px;
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
}
.insight-table td {
  padding: 7px 16px 7px 0;
  border-bottom: 1px solid var(--border-light);
}
.insight-table a { color: var(--nav-active); }
</style>
