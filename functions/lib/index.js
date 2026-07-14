"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerHostingDeploy = exports.deleteCmsUser = exports.createCmsUser = void 0;
const firebase_functions_1 = require("firebase-functions");
(0, firebase_functions_1.setGlobalOptions)({ maxInstances: 10 });
var cmsUsers_js_1 = require("./cmsUsers.js");
Object.defineProperty(exports, "createCmsUser", { enumerable: true, get: function () { return cmsUsers_js_1.createCmsUser; } });
Object.defineProperty(exports, "deleteCmsUser", { enumerable: true, get: function () { return cmsUsers_js_1.deleteCmsUser; } });
var hostingDeploy_js_1 = require("./hostingDeploy.js");
Object.defineProperty(exports, "triggerHostingDeploy", { enumerable: true, get: function () { return hostingDeploy_js_1.triggerHostingDeploy; } });
//# sourceMappingURL=index.js.map