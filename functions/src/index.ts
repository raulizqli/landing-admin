import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

export { createCmsUser, deleteCmsUser } from "./cmsUsers.js";
export { triggerHostingDeploy } from "./hostingDeploy.js";
