// Used only by Jest to transform the small number of ESM-only node_modules
// dependencies (currently htmlparser2, pulled in transitively by
// sanitize-html) that Jest's default CommonJS pipeline can't parse as-is.
// Application/test source code is transformed by ts-jest, not this file.
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]]
};
