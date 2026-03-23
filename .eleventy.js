const markdownIt = require("markdown-it");
const markdownItKatex = require("@traptitech/markdown-it-katex");

module.exports = function (eleventyConfig) {
  // Markdown with KaTeX support
  const md = markdownIt({ html: true, linkify: true, typographer: true });
  md.use(markdownItKatex);
  eleventyConfig.setLibrary("md", md);

  // Passthrough copy
  eleventyConfig.addPassthroughCopy({ "resume.pdf": "resume.pdf" });
  eleventyConfig.addPassthroughCopy({ "cv.pdf": "cv.pdf" });
  eleventyConfig.addPassthroughCopy({ "the-birthday-doxology.pdf": "the-birthday-doxology.pdf" });
  eleventyConfig.addPassthroughCopy("src/assets");

  // Images co-located with writing & project folders (Obsidian-style)
  eleventyConfig.addPassthroughCopy("src/writing/**/*.{png,jpg,jpeg,gif,svg,webp,avif}");
  eleventyConfig.addPassthroughCopy("src/projects/**/*.{png,jpg,jpeg,gif,svg,webp,avif}");

  // Collections
  eleventyConfig.addCollection("projects", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/projects/**/*.md")
      .filter(item => !item.inputPath.includes("/projects/index.liquid"))
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("writing", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/writing/**/*.md")
      .filter(item => !item.inputPath.includes("/writing/index.liquid"))
      .sort((a, b) => b.date - a.date);
  });

  // Filters
  eleventyConfig.addFilter("dateFormat", function (date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  });

  eleventyConfig.addFilter("dateYear", function (date) {
    return new Date(date).getUTCFullYear();
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
