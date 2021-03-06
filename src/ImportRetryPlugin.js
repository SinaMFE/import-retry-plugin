/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const Template = require("webpack/lib/Template")
const { SyncWaterfallHook } = require("tapable");
class ImportRetryPlugin {
	apply(compiler) {
		compiler.hooks.compilation.tap("JsonpTemplatePlugin", compilation => {
			let mainTemplate = compilation.mainTemplate;
				// TODO webpack 5, no adding to .hooks, use WeakMap and static methods
			["jsonpScript", "linkPreload", "linkPrefetch"].forEach(hook => {
				if (!mainTemplate.hooks[hook]) {
					mainTemplate.hooks[hook] = new SyncWaterfallHook([
						"source",
						"chunk",
						"hash"
					]);
				}
			});
			mainTemplate.hooks.jsonpScript.tap(
				"JsonpMainTemplatePlugin",
				(_, chunk, hash) => {
					const crossOriginLoading =
						mainTemplate.outputOptions.crossOriginLoading;
					const chunkLoadTimeout = mainTemplate.outputOptions.chunkLoadTimeout;
					const jsonpScriptType = mainTemplate.outputOptions.jsonpScriptType;
					return Template.asString([
						"var script = document.createElement('script');",
						"var onScriptComplete;",
						jsonpScriptType
							? `script.type = ${JSON.stringify(jsonpScriptType)};`
							: "",
						"script.charset = 'utf-8';",
						`script.timeout = ${chunkLoadTimeout / 1000};`,
						`if (${mainTemplate.requireFn}.nc) {`,
						Template.indent(
							`script.setAttribute("nonce", ${mainTemplate.requireFn}.nc);`
						),
						"}",
						"if(!window.retryerror){",
                            "window.retryerror={};",
                        "}",
                        "var src = jsonpScriptSrc(chunkId);",
                        "if(window.retryerror[chunkId]==1){",
                            "src=src.indexOf('?')>0?(src+'&t='+new Date().getTime()):src+'?t='+new Date().getTime()",
                        "}",
						"script.src = src;",
						crossOriginLoading
							? Template.asString([
									"if (script.src.indexOf(window.location.origin + '/') !== 0) {",
									Template.indent(
										`script.crossOrigin = ${JSON.stringify(crossOriginLoading)};`
									),
									"}"
							  ])
							: "",
						"onScriptComplete = function (event) {",
						Template.indent([
							"// avoid mem leaks in IE.",
							"script.onerror = script.onload = null;",
							"clearTimeout(timeout);",
							"var chunk = installedChunks[chunkId];",
							"if(chunk !== 0) {",
							Template.indent([
								"if(chunk) {",
								Template.indent([
									
									"var realSrc = event && event.target && event.target.src;",
									"if(window.retryerror[chunkId]==1){",
										"if(window.onChunkError){window.onChunkError(realSrc,2)}",
										"var errorType = event && (event.type === 'load' ? 'missing' : event.type);",
										"var error = new Error('Loading chunk ' + chunkId + ' failed.\\n(' + errorType + ': ' + realSrc + ')');",
										"error.type = errorType;",
										"error.request = realSrc;",
										"chunk[1](error);",
										"installedChunks[chunkId] = undefined;",
										"return;",
									"}"
								]),
								"}",
								"window.retryerror[chunkId]=1;",
								"if(window.onChunkError){window.onChunkError(realSrc,1)}",
								"installedChunks[chunkId] = undefined;",
								"requireEnsure(chunkId);"
							]),
							"}"
						]),
						"};",
						"var timeout = setTimeout(function(){",
						Template.indent([
							"onScriptComplete({ type: 'timeout', target: script });"
						]),
						`}, ${chunkLoadTimeout});`,
						"script.onerror = script.onload = onScriptComplete;"
					]);
				}
			);
		});
	}
}
module.exports = ImportRetryPlugin;