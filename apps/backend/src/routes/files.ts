import { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

export const filesRouter: RouterType = Router();

filesRouter.get('/', async (req, res) => {
  try {
    const filePath = req.query.path as string;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (!path.isAbsolute(filePath)) {
      return res.status(400).json({ error: 'Path must be absolute' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.lstat(filePath);
    const isSymlink = stats.isSymbolicLink();
    const realPath = isSymlink ? await fs.realpath(filePath) : filePath;
    const extension = path.extname(filePath);

    res.json({
      content,
      extension,
      isSymlink,
      realPath,
      path: filePath
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(500).json({ error: 'Failed to read file' });
  }
});

filesRouter.put('/', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (!path.isAbsolute(filePath)) {
      return res.status(400).json({ error: 'Path must be absolute' });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    const stats = await fs.lstat(filePath);
    const targetPath = stats.isSymbolicLink() ? await fs.realpath(filePath) : filePath;

    await fs.writeFile(targetPath, content, 'utf-8');

    res.json({ success: true, path: targetPath });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(500).json({ error: 'Failed to write file' });
  }
});
