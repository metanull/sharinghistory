<script setup>
// A thin mount of @metanull/viewer-layout's own SiteShell: the menu, the
// active entry and the footer text all come from `dataset.config.js`'s
// `navigation` (SiteShell reads it through viewer-core's `useSiteConfig()`)
// plus the footer text passed here; `$attrs` carries the language state
// PageShell needs (`language`, `languages`, `update:language`) straight
// through, the same as before. All this file still supplies is what a
// config cannot — the header lockup markup — in the #brand slot.
import { useI18n } from '@metanull/viewer-core'
import { SiteShell } from '@metanull/viewer-layout/components'

const { t } = useI18n()
</script>

<template>
  <SiteShell v-bind="$attrs" :footer-text="t('sharinghistory.identity.copyright')">
    <template #brand>
      <a class="site-logo" href="#/">
        <span class="site-logo-org">{{ t('sharinghistory.identity.organisation') }}</span>
        <span class="site-logo-title">{{ t('sharinghistory.identity.title') }}</span>
        <span class="site-logo-sub">{{ t('sharinghistory.identity.strapline') }}</span>
      </a>
    </template>
    <slot />
  </SiteShell>
</template>

<style scoped>
.site-logo {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-decoration: none !important;
  /* The global `a { color }` rule (site.css) would otherwise win over the
     header's own inherited text colour, since it targets the element
     directly rather than through inheritance. */
  color: var(--mwnf-header-text);
}
.site-logo:hover {
  color: var(--mwnf-header-text);
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
</style>
