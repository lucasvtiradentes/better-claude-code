import { OpenAPIHono } from '@hono/zod-openapi';
import * as getFile from './use-cases/get-file.js';
import * as getFileList from './use-cases/get-file-list.js';
import * as updateFile from './use-cases/update-file.js';

export const filesRouter = new OpenAPIHono();

filesRouter.openapi(getFileList.route, getFileList.handler);
filesRouter.openapi(getFile.route, getFile.handler);
filesRouter.openapi(updateFile.route, updateFile.handler);
