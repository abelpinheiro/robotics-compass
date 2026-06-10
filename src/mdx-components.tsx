import type { MDXComponents } from 'mdx/types'

// Global MDX component overrides live here. Lesson-specific styling and the
// section/Callout/Viz components are wired up in Phase 2 with the design system.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  }
}
