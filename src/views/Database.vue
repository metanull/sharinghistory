<script setup>
import { I18nText } from '@metanull/viewer-core'
import { SearchFormView } from '@metanull/viewer-layout/views'
import { databaseSearch } from '../composables/catalogue.js'
</script>

<template>
  <div>
    <h1 class="mwnf-heading">{{ $t('sharinghistory.nav.database') }}</h1>

    <div class="mwnf-panel">
      <SearchFormView :spec="databaseSearch">
        <template #intro>
          <I18nText tag="p" class="intro-text" keypath="catalogue.search.intro" />
        </template>
      </SearchFormView>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text);
  margin-bottom: 16px;
}
</style>
