import { OpenAPIHono } from '@hono/zod-openapi';
import * as createLabel from './use-cases/create-label.js';
import * as createSessionLabel from './use-cases/create-session-label.js';
import * as deleteLabel from './use-cases/delete-label.js';
import * as deleteSessionLabel from './use-cases/delete-session-label.js';
import * as getSettings from './use-cases/get-settings.js';
import * as patchSettings from './use-cases/patch-settings.js';
import * as updateLabel from './use-cases/update-label.js';
import * as updateSessionLabel from './use-cases/update-session-label.js';

export const settingsRouter = new OpenAPIHono();

settingsRouter.openapi(getSettings.route, getSettings.handler);
settingsRouter.openapi(patchSettings.route, patchSettings.handler);
settingsRouter.openapi(createLabel.route, createLabel.handler);
settingsRouter.openapi(updateLabel.route, updateLabel.handler);
settingsRouter.openapi(deleteLabel.route, deleteLabel.handler);
settingsRouter.openapi(createSessionLabel.route, createSessionLabel.handler);
settingsRouter.openapi(updateSessionLabel.route, updateSessionLabel.handler);
settingsRouter.openapi(deleteSessionLabel.route, deleteSessionLabel.handler);
