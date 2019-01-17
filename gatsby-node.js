const _ = require('lodash')

// graphql function returns a promise so we can use this little promise helper to have a nice result/error state
const wrapper = promise => promise.then(result => ({ result, error: null })).catch(error => ({ error, result: null }))

exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions
  let slug
  if (node.internal.type === 'Mdx') {
    if (
      Object.prototype.hasOwnProperty.call(node, 'frontmatter') &&
      Object.prototype.hasOwnProperty.call(node.frontmatter, 'slug')
    ) {
      slug = `/${_.kebabCase(node.frontmatter.slug)}`
    }
    if (
      Object.prototype.hasOwnProperty.call(node, 'frontmatter') &&
      Object.prototype.hasOwnProperty.call(node.frontmatter, 'title')
    ) {
      slug = `/${_.kebabCase(node.frontmatter.title)}`
    }
    createNodeField({ node, name: 'slug', value: slug })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const postPage = require.resolve('src/templates/post.js')
  const categoryPage = require.resolve('src/templates/category.js')

  const { error, result } = await wrapper(
    graphql`
      {
        posts: allMdx {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
                category
              }
            }
          }
        }
      }
    `
  )

  if (!error) {
    const posts = result.data.posts.edges

    posts.forEach((edge, index) => {
      const next = index === 0 ? null : posts[index - 1].node
      const prev = index === posts.length - 1 ? null : posts[index + 1].node

      createPage({
        path: edge.node.fields.slug,
        component: postPage,
        context: {
          slug: edge.node.fields.slug,
          prev,
          next,
        },
      })
    })

    let categories = []

    _.each(posts, edge => {
      if (_.get(edge, 'node.frontmatter.category')) {
        categories = categories.concat(edge.node.frontmatter.category)
      }
    })

    categories = _.uniq(categories)

    categories.forEach(category => {
      createPage({
        path: `/categories/${_.kebabCase(category)}`,
        component: categoryPage,
        context: {
          category,
        },
      })
    })

    return
  }

  console.log(error)
}
