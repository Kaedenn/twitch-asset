module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:node/recommended"
  ],
  root: true,
  plugins: ["import", "node"],
  env: {
    "es6": true,
    "node": true,
    "commonjs": true
  },
  settings: {
    "import/resolver": {
      alias: {
        map: [
          ["#helpers", "./src/helpers"],
          ["#services", "./src/services"]
        ],
      }
    }
  },
  rules: {
    "import/no-unresolved": ["error", { "commonjs": true }],
    "import/no-extraneous-dependencies": "error",
    "node/no-missing-require": "off",
    "node/no-extraneous-import":"off",
  }
}
