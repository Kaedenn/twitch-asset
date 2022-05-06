module.exports = {
  extends: ["eslint:recommended", "plugin:node/recommended"],
  root: true,
  plugins: ["import", "node"],
  env: {
    es6: true,
    node: true,
    commonjs: true
  },
  settings: {
    "import/resolver": {
      alias: {
        map: [
          ["#helpers", "./src/helpers"],
          ["#services", "./src/services"]
        ]
      }
    }
  },
  rules: {
    "import/no-unresolved": ["error", { commonjs: true }],
    "import/no-extraneous-dependencies": "error",
    "node/no-missing-require": "off",
    "node/no-extraneous-import": "off"
  },
  overrides: [
    {
      /* This is because, for some reason, I can't get eslint-plugin-mocha
       * working; I get the following error:
       * Package subpath './src/find' is not defined by "exports" in
       *      node_modules/ramda/package.json
       */
      files: ["src/test/*.js"],
      globals: {
        describe: "readonly",
        it: "readonly"
      }
    },
    {
      files: ["src/index.js"],
      rules: {
        "no-process-exit": "off"
      }
    }
  ]
};
