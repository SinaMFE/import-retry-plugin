/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Template = require("webpack/lib/Template");

var _require = require("tapable"),
    SyncWaterfallHook = _require.SyncWaterfallHook;

var ImportRetryPlugin = function () {
	function ImportRetryPlugin() {
		_classCallCheck(this, ImportRetryPlugin);
	}

	_createClass(ImportRetryPlugin, [{
		key: "apply",
		value: function apply(compiler) {
			// for(var a in compiler.hooks){
			// 	console.log(a);
			// }
			// console.log(compiler.hooks.shouldEmit);
			compiler.hooks.compilation.tap("JsonpTemplatePlugin", function (compilation) {
				var mainTemplate = compilation.mainTemplate;
				console.log(mainTemplate.hooks);
				console.log('hahahahaha');
				// TODO webpack 5, no adding to .hooks, use WeakMap and static methods
				["jsonpScript", "linkPreload", "linkPrefetch"].forEach(function (hook) {
					if (!mainTemplate.hooks[hook]) {
						mainTemplate.hooks[hook] = new SyncWaterfallHook(["source", "chunk", "hash"]);
					}
				});
				mainTemplate.hooks.jsonpScript.tap("JsonpMainTemplatePlugin", function (_, chunk, hash) {
					var crossOriginLoading = mainTemplate.outputOptions.crossOriginLoading;
					var chunkLoadTimeout = mainTemplate.outputOptions.chunkLoadTimeout;
					var jsonpScriptType = mainTemplate.outputOptions.jsonpScriptType;

					return Template.asString(["var script = document.createElement('script');", "var onScriptComplete;", jsonpScriptType ? `script.type = ${JSON.stringify(jsonpScriptType)};` : "", "script.charset = 'utf-8';", `script.timeout = ${chunkLoadTimeout / 1000};`, `if (${mainTemplate.requireFn}.nc) {`, Template.indent(`script.setAttribute("nonce", ${mainTemplate.requireFn}.nc);`), "}", "script.src = jsonpScriptSrc(chunkId);", crossOriginLoading ? Template.asString(["if (script.src.indexOf(window.location.origin + '/') !== 0) {", Template.indent(`script.crossOrigin = ${JSON.stringify(crossOriginLoading)};`), "}"]) : "", "onScriptComplete = function (event) {", Template.indent(["// avoid mem leaks in IE.", "script.onerror = script.onload = null;", "clearTimeout(timeout);", "var chunk = installedChunks[chunkId];", "if(chunk !== 0) {", Template.indent(["if(chunk) {", Template.indent(["var errorType = event && (event.type === 'load' ? 'missing' : event.type);", "var realSrc = event && event.target && event.target.src;", "var error = new Error('hahhaa 我该好你了 chunk ' + chunkId + ' failed.\\n(' + errorType + ': ' + realSrc + ')');", "error.type = errorType;", "error.request = realSrc;", "chunk[1](error);"]), "}", "installedChunks[chunkId] = undefined;"]), "}"]), "};", "var timeout = setTimeout(function(){", Template.indent(["onScriptComplete({ type: 'timeout', target: script });"]), `}, ${chunkLoadTimeout});`, "script.onerror = script.onload = onScriptComplete;"]);
				});
			});
		}
	}]);

	return ImportRetryPlugin;
}();

module.exports = ImportRetryPlugin;