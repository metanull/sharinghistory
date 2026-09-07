<script setup>
import { I18nText } from '@metanull/viewer-core'
import { TimelineResultsView } from '@metanull/viewer-layout/views'
import { timelineEntrance } from '../composables/timeline.js'

// The timeline entrance is the platform's composed `TimelineResultsView`,
// `entrance: true`, rendering the spec in composables/timeline.js. What
// fills its `#before` slot is this website's own: the heading and the intro
// paragraph legacy's hcr_home.php printed above the form.
</script>

<template>
  <TimelineResultsView :spec="timelineEntrance" class="timeline-entrance">
    <template #before>
      <h1 class="section-heading">{{ $t('sharinghistory.nav.timeline') }}</h1>
      <I18nText tag="p" class="intro-text" keypath="sharinghistory.timeline.intro" />
    </template>
  </TimelineResultsView>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}

.timeline-entrance {
  background: var(--content-bg);
  border: 1px solid var(--border);
  padding: 20px;
}
</style>
