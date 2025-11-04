import { OpenAPIHono } from '@hono/zod-openapi';
import * as executeProjectAction from './use-cases/execute-project-action.js';
import * as getProjects from './use-cases/get-projects.js';

export const projectsRouter = new OpenAPIHono();

projectsRouter.openapi(getProjects.route, getProjects.handler);
projectsRouter.openapi(executeProjectAction.route, executeProjectAction.handler);
