<script setup>
import { useRouter } from 'vue-router'
import { PartnerMap, RecordLanguages, RelatedRecords } from '@metanull/viewer-layout/content'
import { RecordView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { heldItemRows, partnerSheet } from '../composables/partner.js'

// The partner sheet is the platform's composed record page, rendering the
// spec in composables/partner.js. What fills the page's slots is this
// website's own: the header — the way back, the type badge, the "View
// Objects/Monuments" link the Permanent Collection reads `?partner=` from —
// the contact and logo blocks (the sheet hands them back for a slot, being
// more than one field can hold), the map, and the held-items grid (the
// package models the relation the other way round, an item pointing at its
// partner, so `related` — a record's own declared references — does not
// reach it).

defineProps({ id: { type: String, required: true } })

const router = useRouter()
const { labelOf, mdInline } = useInventoryData()

function back() {
  if (window.history.length > 2) router.back()
  else router.push('/partners')
}

function viewItemsLink(record) {
  return { path: '/permanent-collection/results', query: { partner: record.id } }
}

function normalizeUrl(url) {
  return url.startsWith('http') ? url : `http://${url}`
}

function contactPersons(record) {
  return [record.contact_person_1, record.contact_person_2].filter((cp) => cp && (cp.name || cp.title))
}
</script>

<template>
  <RecordView :spec="partnerSheet" :id="id" class="detail mwnf-panel">
    <template #header="{ record, text, language, languages, select, dir }">
      <div class="detail-top">
        <a class="mwnf-back-bar" href="#" @click.prevent="back">← {{ $t('partner.nav.back') }}</a>
      </div>
      <div><span class="detail-type-badge">{{ record.type === 'institution' ? $t('partner.info.typeInstitution') : $t('partner.info.typeMuseum') }}</span></div>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
      <h1 class="detail-title" :dir="dir" v-html="mdInline(text.name ?? record.id)"></h1>
      <h2 v-if="text.city || record.country_id" class="detail-subtitle">
        <template v-if="text.city">{{ text.city }}<template v-if="record.country_id">, </template></template>
        <template v-if="record.country_id">{{ labelOf('countries', record.country_id) }}</template>
      </h2>

      <div v-if="record.item_count" class="view-items-row">
        <RouterLink :to="viewItemsLink(record)" class="mwnf-button">{{ record.type === 'institution' ? $t('sharinghistory.action.viewMonuments') : $t('sharinghistory.action.viewObjects') }} ({{ record.item_count }}) →</RouterLink>
        <a v-if="text.website" :href="normalizeUrl(text.website)" target="_blank" rel="noopener" class="homepage-link">
          {{ $t('sharinghistory.action.visitWebsite') }} ↗
        </a>
      </div>
    </template>

    <template #contact="{ record, text }">
      <p v-if="text.address" class="contact-address">{{ text.address }}</p>
      <p v-if="text.phone">{{ $t('partner.info.phone') }}: {{ text.phone }}</p>
      <p v-if="text.email"><a :href="`mailto:${text.email}`">{{ text.email }}</a></p>
      <p v-if="text.website">
        <a :href="normalizeUrl(text.website)" target="_blank" rel="noopener">{{ text.website }}</a>
        <template v-for="(u, i) in record.additional_urls" :key="i">
          &nbsp;|&nbsp;<a :href="normalizeUrl(u.url)" target="_blank" rel="noopener">{{ u.title ?? u.url }}</a>
        </template>
      </p>

      <div v-for="(cp, i) in contactPersons(record)" :key="i" class="contact-block contact-person">
        <p v-if="cp.title" class="contact-person-title">{{ cp.title }}</p>
        <p v-if="cp.name">{{ cp.name }}</p>
        <p v-if="cp.phone">{{ $t('partner.info.phone') }}: {{ cp.phone }}</p>
        <p v-if="cp.fax">{{ $t('partner.info.fax') }}: {{ cp.fax }}</p>
        <p v-if="cp.email"><a :href="`mailto:${cp.email}`">{{ cp.email }}</a></p>
      </div>
    </template>

    <template #logo="{ record }">
      <div class="logos">
        <img v-for="(logo, i) in record.logos" :key="i" :src="logo.url" :alt="logo.alt_text ?? ''" class="logo-img" />
      </div>
    </template>

    <template #after-sheet="{ record, text }">
      <!-- 2.10.0's own defaults already name partner.map.map / .mapOf /
           .openInOpenStreetMap (viewer-i18n 2.4.0). -->
      <PartnerMap
        :latitude="record.latitude"
        :longitude="record.longitude"
        :label="text.name"
      />
    </template>

    <template #related="{ record }">
      <RelatedRecords :heading="$t('record.related.items')" :records="heldItemRows(record)" variant="list" />
    </template>
  </RecordView>
</template>

<style scoped>
.detail-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }

.detail-type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--heading);
  border: 1px solid var(--accent);
  padding: 2px 8px;
  margin-bottom: 10px;
  font-family: 'Roboto', sans-serif;
}

.detail-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 4px;
  line-height: 1.3;
  font-family: 'Roboto', sans-serif;
}
.detail-subtitle {
  font-size: 14px;
  font-weight: 400;
  font-style: italic;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}

.view-items-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.homepage-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--nav-active);
  font-family: 'Roboto', sans-serif;
}

.detail :deep(.mwnf-sheet__label--contact),
.detail :deep(.mwnf-sheet__label--logo) { padding-top: 16px; }

.contact-block { font-size: 13px; line-height: 1.7; color: var(--text); font-family: 'Roboto', sans-serif; }
.contact-person { padding-left: 12px; border-left: 3px solid var(--accent); margin-top: 8px; }
.contact-person-title { font-weight: 500; color: var(--heading); }
.contact-address { white-space: pre-line; }

.logos { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.logo-img { max-height: 80px; max-width: 200px; object-fit: contain; }
</style>
