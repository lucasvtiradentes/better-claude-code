import { OpenAPIHono } from '@hono/zod-openapi';
import * as deleteSession from './use-cases/delete-session.js';
import * as getSessionDetail from './use-cases/get-session-detail.js';
import * as getSessionFile from './use-cases/get-session-file.js';
import * as getSessionFolder from './use-cases/get-session-folder.js';
import * as getSessionImages from './use-cases/get-session-images.js';
import * as getSessionPaths from './use-cases/get-session-paths.js';
import * as getSessions from './use-cases/get-sessions.js';
import * as toggleSessionLabel from './use-cases/toggle-session-label.js';

export const sessionsRouter = new OpenAPIHono();

sessionsRouter.openapi(getSessions.route, getSessions.handler);
sessionsRouter.openapi(getSessionDetail.route, getSessionDetail.handler);
sessionsRouter.openapi(getSessionImages.route, getSessionImages.handler);
sessionsRouter.openapi(getSessionFile.route, getSessionFile.handler);
sessionsRouter.openapi(getSessionFolder.route, getSessionFolder.handler);
sessionsRouter.openapi(toggleSessionLabel.route, toggleSessionLabel.handler);
sessionsRouter.openapi(getSessionPaths.route, getSessionPaths.handler);
sessionsRouter.openapi(deleteSession.route, deleteSession.handler);
