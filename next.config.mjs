import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow .md / .mdx files to be treated as pages/modules alongside TS.
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  // Hide the floating Next.js indicator (we provide our own chrome).
  devIndicators: false,
}

const withMDX = createMDX({
  options: {
    // Plugins are passed as strings so they stay serializable for Turbopack.
    // remark-frontmatter parses the `---` block; remark-mdx-frontmatter exports
    // it as a `frontmatter` named export the lesson route can read.
    // remark-math parses $…$ / $$…$$ math.
    remarkPlugins: [
      'remark-frontmatter',
      ['remark-mdx-frontmatter', { name: 'frontmatter' }],
      'remark-math',
    ],
    // rehype-katex renders the parsed math to HTML (needs katex CSS, imported in
    // the root layout). @shikijs/rehype syntax-highlights fenced code blocks.
    rehypePlugins: [
      'rehype-katex',
      ['@shikijs/rehype', { theme: 'github-light' }],
    ],
  },
})

export default withMDX(nextConfig)
