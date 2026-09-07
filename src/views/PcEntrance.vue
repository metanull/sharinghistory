<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText, useFacets } from '@metanull/viewer-core'
import { FacetSelect } from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'
import { FACETS, exhibitionOptions } from '../composables/catalogue.js'

// The Permanent Collection entrance: one filter at a time, chosen by a
// radio, as legacy's form was (decision D2). The options are the values the
// records carry, by the catalogue spec; legacy's "Theme" entry point lists
// the Virtual Exhibitions (pc_entrance.php's exhibition selector). The page
// only writes the query the results page reads.

const router = useRouter()
// `items` is already the visible set — display_status 'N' items excluded,
// declared once as `visible.items` in useInventoryData.js — so the facet
// options here already match what the results page will show.
const { items } = useInventoryData()
const options = useFacets(items, FACETS)
const themes = computed(() => exhibitionOptions())

const filterType = ref('country') // country | theme | partner | begin | end
const selected = ref({ country: '', theme: '', partner: '', begin: '', end: '' })

// The theme radio writes the `exhibition` key the results page reads.
const QUERY_KEY = { country: 'country', theme: 'exhibition', partner: 'partner', begin: 'begin', end: 'end' }

function search() {
  const q = {}
  const value = selected.value[filterType.value]
  if (value) q[QUERY_KEY[filterType.value]] = String(value)
  router.push({ name: 'permanent-collection-results', query: q })
}
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('sharinghistory.nav.permanentCollection') }}</h1>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="sharinghistory.pc.intro" />

      <form class="filter-form" @submit.prevent="search">
        <!-- `value` is the filter this row drives and never a text; each label is
             written out so the check that every name resolves can read it. -->
        <div
          v-for="opt in [
            { value: 'country', label: $t('catalogue.facet.country') },
            { value: 'theme', label: $t('sharinghistory.filter.theme') },
            { value: 'partner', label: $t('catalogue.facet.holdingInstitution') },
            { value: 'begin', label: $t('catalogue.facet.startDate') },
            { value: 'end', label: $t('catalogue.facet.endDate') },
          ]"
          :key="opt.value"
          class="filter-row"
        >
          <label class="filter-choice" :for="`filter-${opt.value}`">
            <input :id="`filter-${opt.value}`" v-model="filterType" type="radio" name="filterType" :value="opt.value" />
            {{ opt.label }}
          </label>
          <div class="filter-control">
            <FacetSelect
              v-if="opt.value === 'theme'"
              v-model="selected.theme"
              :options="themes"
              :placeholder="$t('sharinghistory.filter.selectTheme')"
              :disabled="filterType !== 'theme'"
            />
            <FacetSelect
              v-else-if="options[opt.value]"
              v-model="selected[opt.value]"
              :options="options[opt.value]"
              :placeholder="opt.value === 'country' ? $t('catalogue.facet.selectCountry') : $t('catalogue.facet.selectInstitution')"
              :disabled="filterType !== opt.value"
            />
            <input
              v-else
              v-model="selected[opt.value]"
              type="number"
              :disabled="filterType !== opt.value"
              :placeholder="opt.value === 'begin' ? $t('timeline.form.fromYearHint') : $t('sharinghistory.filter.endDateHint')"
            />
          </div>
        </div>

        <div class="filter-row actions">
          <span class="filter-choice"></span>
          <button type="submit" class="btn">{{ $t('core.action.browse') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
}
.filter-form { display: flex; flex-direction: column; gap: 8px; }
.filter-row { display: flex; align-items: center; gap: 16px; }
.filter-choice {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 200px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}
.filter-control :deep(.mwnf-facet__select) { width: 280px; }
.filter-control input[type='number'] { width: 120px; }
.filter-control :deep(select:disabled),
.filter-control input:disabled { opacity: 0.4; cursor: not-allowed; }
.actions { padding-top: 6px; }
</style>
