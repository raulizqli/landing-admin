"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCmsUser = exports.createCmsUser = void 0;
const firebase_functions_1 = require("firebase-functions");
(0, firebase_functions_1.setGlobalOptions)({ maxInstances: 10 });
var cmsUsers_js_1 = require("./cmsUsers.js");
Object.defineProperty(exports, "createCmsUser", { enumerable: true, get: function () { return cmsUsers_js_1.createCmsUser; } });
Object.defineProperty(exports, "deleteCmsUser", { enumerable: true, get: function () { return cmsUsers_js_1.deleteCmsUser; } });
//# sourceMappingURL=index.js.map