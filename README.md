
<h2 align="center">Scope</h2>

1. cdn hijacking occasionally; sometimes  request with  random params (like "react.js?v=12345) is usefull;
2. the plugin is in case of webpack4  and is work only with chunked script

<h2 align="center">routeMap</h2>

1. report error
2. use SRI


<h2 align="center">Install</h2>

```bash
npm i import-retry-plugin --save
```

<h2 align="center"><a href="#">Usage</a></h2>

**webpack.config.js**

```js
const ImportRetryPlugin =require("import-retry-plugin");
module.exports = {
  plugins:[new ImportRetryPlugin()]
}
