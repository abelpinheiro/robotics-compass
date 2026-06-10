import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow .md / .mdx files to be treated as pages/modules alongside TS.
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
}

const withMDX = createMDX({
  options: {
    // Plugins are passed as strings so they stay serializable for Turbopack.
    // remark-frontmatter parses the `---` block; remark-mdx-frontmatter exports
    // it as a `frontmatter` named export the lesson route can read.
    remarkPlugins: [
      'remark-frontmatter',
      ['remark-mdx-frontmatter', { name: 'frontmatter' }],
    ],
  },
})

export default withMDX(nextConfig)
