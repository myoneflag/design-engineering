module.exports = {
    extends: [
        // add more generic rulesets here, such as:
        'eslint:recommended',
        'plugin:vue/recommended',
        'prettier/vue',
        "plugin:prettier/recommended"
    ],
    rules: {
        // override/add rules settings here, such as:
        // 'vue/no-unused-vars': 'error'
        "comma-dangle": "off",
        "no-mixed-requires": "off",
        "quote-props": "off",
    }
};
