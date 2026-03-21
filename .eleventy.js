const markdownIt = require("markdown-it");
const markdownItKatex = require("markdown-it-katex");

module.exports = function (eleventyConfig) {
  // Markdown with KaTeX support
  const md = markdownIt({ html: true, linkify: true, typographer: true });
  md.use(markdownItKatex);
  eleventyConfig.setLibrary("md", md);

  // Passthrough copy
  eleventyConfig.addPassthroughCopy({ "resume.pdf": "resume.pdf" });
  eleventyConfig.addPassthroughCopy({ "cv.pdf": "cv.pdf" });
  eleventyConfig.addPassthroughCopy("src/assets");

  // Collections
  eleventyConfig.addCollection("projects", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/projects/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("writing", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/writing/*.md").sort((a, b) => b.date - a.date);
  });

  // Filters
  eleventyConfig.addFilter("dateFormat", function (date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  eleventyConfig.addFilter("dateYear", function (date) {
    return new Date(date).getFullYear();
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["liquid", "md", "html"],
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
  };
};
