<script setup>
import { BackLink } from '@metanull/viewer-layout/content'
import { PartnerListView } from '@metanull/viewer-layout/views'
import { partnersList } from '../composables/partner.js'

// `PartnerListView`'s own count (`spec.count`) sums only `main`/`associated`
// — with `nested: true` an associated partner moved under its parent is in
// neither, so the "Partners found" line would undercount. Walked here
// instead, over the same `groups` the view hands every slot.
function totalCount(groups) {
  return groups.reduce(
    (sum, group) => sum + group.main.reduce((s, entry) => s + 1 + (entry.children?.length ?? 0), 0) + group.associated.length,
    0,
  )
}
</script>

<template>
  <PartnerListView :spec="partnersList" class="mwnf-panel partners-results">
    <template #before="{ groups }">
      <BackLink label="partner.nav.back" :to="{ name: 'partners' }" />
      <h1 class="mwnf-heading">
        {{ $t('sharinghistory.nav.partners') }}
        <span class="heading-project"> — {{ $t('sharinghistory.identity.title') }}</span>
      </h1>
      <p class="result-count">{{ $t('sharinghistory.results.partnersFound') }}: {{ totalCount(groups) }}</p>
    </template>
  </PartnerListView>
</template>

<style scoped>
.heading-project { font-weight: normal; font-size: 14px; color: var(--muted); }

/* .partners-results carries no styles of its own now (mwnf-panel supplies
   the box) — kept only as the :deep() scoping hook below. */

.result-count {
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.partners-results :deep(.mwnf-partner-list__empty) { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; padding: 20px 0; }

.partners-results :deep(.mwnf-partner-list__group) {
  border-bottom: 1px solid var(--border-light);
  padding: 10px 0;
}
.partners-results :deep(.mwnf-partner-list__group:last-child) { border-bottom: none; }

.partners-results :deep(.mwnf-partner-list__group-heading) { cursor: pointer; list-style: none; }
.partners-results :deep(.mwnf-partner-list__group-heading)::-webkit-details-marker { display: none; }
.partners-results :deep(.mwnf-partner-list__group-title) {
  display: inline-block;
  font-size: 15px;
  font-weight: 500;
  color: var(--heading);
  font-family: 'Roboto', sans-serif;
}
.partners-results :deep(.mwnf-partner-list__group-title)::before { content: '▸ '; color: var(--accent); }
.partners-results :deep(details[open] > .mwnf-partner-list__group-heading .mwnf-partner-list__group-title)::before { content: '▾ '; }

.partners-results :deep(.mwnf-partner-list__tier) {
  display: flex;
  gap: 32px;
  padding: 8px 0 4px 16px;
  flex-wrap: wrap;
}
.partners-results :deep(.mwnf-partner-list__row-block) { flex: 1; min-width: 220px; }
.partners-results :deep(.mwnf-partner-list__row) {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  font-family: 'Roboto', sans-serif;
  padding: 3px 0;
}
.partners-results :deep(.mwnf-partner-list__children) { padding-left: 16px; }
.partners-results :deep(.mwnf-partner-list__logo) { width: 28px; height: 28px; object-fit: contain; }
.partners-results :deep(.mwnf-partner-list__meta) { color: var(--muted); font-size: 11px; }

.partners-results :deep(.mwnf-partner-list__tier--associated) { flex: 1 0 100%; }
.partners-results :deep(.mwnf-partner-list__tier-label) {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-weight: bold;
  margin-bottom: 4px;
}
</style>
