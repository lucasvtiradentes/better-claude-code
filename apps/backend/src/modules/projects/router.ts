import { OpenAPIHono } from '@hono/zod-openapi';
import * as executeProjectAction from './use-cases/execute-project-action.js';
import * as getProjects from './use-cases/get-projects.js';
import * as toggleProjectLabel from './use-cases/toggle-project-label.js';

export const projectsRouter = new OpenAPIHono();

projectsRouter.openapi(getProjects.route, getProjects.handler);
projectsRouter.openapi(executeProjectAction.route, executeProjectAction.handler);
projectsRouter.openapi(toggleProjectLabel.route, toggleProjectLabel.handler);
