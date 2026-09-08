<script setup>
import { useRouter } from 'vue-router'
import { I18nText } from '@metanull/viewer-core'

const router = useRouter()

function browse() {
  router.push({ path: '/partners/results' })
}
</script>

<template>
  <div>
    <h1 class="mwnf-heading">{{ $t('sharinghistory.nav.partners') }}</h1>

    <div class="mwnf-panel">
      <I18nText tag="p" class="intro-text" keypath="sharinghistory.partner.introDiscover" />

      <table class="mwnf-form-table filter-table">
        <tbody>
          <tr>
            <th><label>{{ $t('sharinghistory.nav.partners') }}</label></th>
            <td>
              <button class="mwnf-button" @click="browse()">{{ $t('sharinghistory.action.browsePartners') }} →</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}

.filter-table th {
  text-align: left;
  font-weight: normal;
  padding: 10px 16px 10px 0;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
  width: auto;
}
</style>
