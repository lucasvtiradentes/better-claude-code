import { OpenAPIHono } from '@hono/zod-openapi';
import * as getFile from './use-cases/get-file.js';
import * as getFileList from './use-cases/get-file-list.js';
import * as getImage from './use-cases/get-image.js';
import * as saveClipboardImage from './use-cases/save-clipboard-image.js';
import * as updateFile from './use-cases/update-file.js';

export const filesRouter = new OpenAPIHono();

filesRouter.openapi(getFileList.route, getFileList.handler);
filesRouter.openapi(getFile.route, getFile.handler);
filesRouter.openapi(getImage.route, getImage.handler);
filesRouter.openapi(saveClipboardImage.route, saveClipboardImage.handler);
filesRouter.openapi(updateFile.route, updateFile.handler);
