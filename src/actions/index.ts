"use server";

// Auth-related actions (signUp/signIn/signOut/getUser) were removed along
// with the rest of the auth system. Project-level actions are re-exported
// from their own files.
export { createProject } from "./create-project";
export { createBlankProject } from "./create-blank-project";
export { createFromTemplate } from "./create-from-template";
export { getProject } from "./get-project";
export { getProjects } from "./get-projects";
export { getTemplatesAction } from "./get-templates";
export { getSharedProject } from "./get-shared-project";
