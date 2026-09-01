<script setup>
// PageShell with the legacy MWNF header lockup ("Museum With No Frontiers"
// over "Sharing History" over the period strapline) supplied through the
// header slot. All other PageShell props and the update:language event pass
// through untouched via $attrs.
import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
import { PageShell } from '@metanull/viewer-layout'

const { t } = useI18n()

// The menu is built here rather than in dataset.config.js because a label is a
// text and a text is only available inside the application: `t` needs the
// installed catalogue, and every name has to be written out where it is used
// so `viewer-i18n-check` can see it. The config keeps what is not a text —
// the offered languages — and PageShell receives these links after $attrs, so
// they take precedence over anything the config still passes.
// The legacy site's own top-level sections, in its own order — this site leads
// with the exhibitions and adds the two historical sections.
const navLinks = computed(() => [
  { label: t('core.nav.home'), href: '#/' },
  { label: t('sharinghistory.nav.exhibitions'), href: '#/exhibitions' },
  { label: t('sharinghistory.nav.permanentCollection'), href: '#/permanent-collection' },
  { label: t('sharinghistory.nav.database'), href: '#/database' },
  { label: t('sharinghistory.nav.timeline'), href: '#/timeline' },
  { label: t('sharinghistory.nav.historicalBackground'), href: '#/historical-background' },
  { label: t('sharinghistory.nav.historicalProfiles'), href: '#/historical-profiles' },
  { label: t('sharinghistory.nav.partners'), href: '#/partners' },
])
</script>

<template>
  <PageShell
    v-bind="$attrs"
    :nav-links="navLinks"
    :footer-text="$t('sharinghistory.identity.copyright')"
  >
    <template #header>
      <a class="site-logo" href="#/">
        <span class="site-logo-org">{{ $t('sharinghistory.identity.organisation') }}</span>
        <span class="site-logo-title">{{ $t('sharinghistory.identity.title') }}</span>
        <span class="site-logo-sub">{{ $t('sharinghistory.identity.strapline') }}</span>
      </a>
    </template>
    <slot />
  </PageShell>
</template>

<style scoped>
.site-logo {
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--header-fg);
  text-decoration: none !important;
}
.site-logo-org {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 400;
  opacity: 0.8;
}
.site-logo-title {
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.site-logo-sub {
  font-size: 12px;
  letter-spacing: 0.04em;
  opacity: 0.9;
}
.site-logo:hover {
  color: var(--header-fg);
}
</style>
