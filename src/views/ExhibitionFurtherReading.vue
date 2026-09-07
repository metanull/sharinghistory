<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LinkListView } from '@metanull/viewer-layout/views'
import { exhibitionTree } from '../composables/exhibitions.js'
import { furtherReadingSpec } from '../composables/exhibitionSpecs.js'

// Legacy exhibitions/AWE/bibliography.php — the per-exhibition "Further
// Reading" bibliography, one list per language (composables/exhibitionSpecs.js
// resolves the language and the sort). An exhibition id this package does
// not carry degrades to the view's own empty state rather than a hard
// not-found: there is nothing left on this page for a bad id to break.

const route = useRoute()
const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))
const exhibition = computed(() => exhibitionTree.byId.value.get(exhibitionId.value) ?? null)
const spec = computed(() => furtherReadingSpec(exhibition.value))
</script>

<template>
  <LinkListView :spec="spec" />
</template>
