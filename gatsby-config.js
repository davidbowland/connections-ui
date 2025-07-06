/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
if (process.env.DEVELOPMENT) {
  require('dotenv').config({
    path: '.env.development',
  })
} else {
  require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`,
  })
}

module.exports = {
  plugins: [
    {
      options: {
        alias: {
          '@components': 'src/components',
          '@config': 'src/config',
          '@hooks': 'src/hooks',
          '@pages': 'src/pages',
          '@services': 'src/services',
          '@test': 'test',
          '@types': 'src/types',
        },
        extensions: ['js', 'jsx', 'ts', 'tsx'],
      },
      resolve: 'gatsby-plugin-alias-imports',
    },
    'gatsby-plugin-image',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-sharp',
    'gatsby-plugin-styled-components',
    'gatsby-transformer-sharp',
    {
      __key: 'pages',
      options: {
        name: 'pages',
        path: 'src/pages/',
      },
      resolve: 'gatsby-source-filesystem',
    },
  ],
  siteMetadata: {
    siteUrl: 'https://connections.dbowland.com',
    title: 'Connections',
  },
}
