<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useInventoryData } from '../composables/useInventoryData.js'

// Legacy exhibitions/AWE/bibliography.php — the per-exhibition "Further
// Reading" bibliography, one list per language. The importer injects the
// legacy rel_sh_bibliography_exhibition entries into every collection
// translation's extra.bibliography as the same language-keyed map, so the
// English translation already carries all languages.
const route = useRoute()
const router = useRouter()
const { exhibitionById, enCollectionTranslations, md, mdInline, mdStrip } = useInventoryData()

const exhibition = computed(() => exhibitionById(decodeURIComponent(route.params.exhibitionId)) ?? null)

const text = computed(() => {
  const e = exhibition.value
  return e ? (enCollectionTranslations.value[e.id] ?? {}) : {}
})

const bibliography = computed(() => text.value.extra?.bibliography ?? {})

const availableLangs = computed(() =>
  Object.keys(bibliography.value).filter(lang => bibliography.value[lang]?.length)
)

// `availableLangs` here is the bibliography's own language set, not the site's:
// legacy stores one list per language and a given exhibition rarely has them
// all. Follow the site language when this bibliography has it, else English,
// else whatever single list exists — an empty section is worse than a list a
// reader can still use.
const { locale } = useI18n()
const activeLang = computed(() => {
  const langs = availableLangs.value
  if (langs.includes(locale.value)) return locale.value
  return langs.includes('en') ? 'en' : (langs[0] ?? '')
})

// Legacy bibliography.php lists entries alphabetically, ignoring the link
// table's sort_order (e.g. exhibition 1 leads with Akurgal, sort_order 10).
const entries = computed(() =>
  [...(bibliography.value[activeLang.value] ?? [])].sort((a, b) =>
    mdStrip(a).localeCompare(mdStrip(b))
  )
)

// Bibliography entries read right-to-left in Arabic.
const contentDir = computed(() => (activeLang.value === 'ar' ? 'rtl' : 'ltr'))

function back() {
  if (window.history.length > 2) {
    router.back()
  } else if (exhibition.value) {
    router.push(`/exhibitions/${exhibition.value.id}`)
  } else {
    router.push('/exhibitions')
  }
}
</script>

<template>
  <div v-if="!exhibition" class="content-box not-found">
    <p>Exhibition not found.</p>
    <router-link to="/exhibitions">← Return to Exhibitions</router-link>
  </div>

  <div v-else class="reading-wrap">
    <a class="back-link" href="#" @click.prevent="back">← Back to {{ text.title ?? exhibition.internal_name }}</a>

    <div class="content-box">
      <h1 class="reading-title">Further Reading</h1>
      <h2 class="reading-subtitle" v-html="mdInline(text.title ?? exhibition.internal_name)" />

      <div v-if="entries.length" class="reading-entries" :dir="contentDir">
        <div v-for="(entry, i) in entries" :key="i" class="reading-entry prose" v-html="md(entry)" />
      </div>
      <p v-else class="no-results">No bibliography available for this exhibition.</p>
    </div>
  </div>
</template>

<style scoped>
.not-found { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; }

.reading-wrap { display: flex; flex-direction: column; gap: 10px; }


.reading-title {
  font-size: 20px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 4px;
  font-family: 'Roboto', sans-serif;
}
.reading-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  font-family: 'Roboto', sans-serif;
}

.reading-entries { display: flex; flex-direction: column; gap: 10px; }
.reading-entry { font-size: 14px; line-height: 1.7; color: var(--text); font-family: 'Roboto', sans-serif; }
.prose :deep(p) { margin: 0; }
.prose :deep(em) { font-style: italic; }

.no-results { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; padding: 12px 0; }
</style>
