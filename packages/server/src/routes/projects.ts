import { Hono } from 'hono';
import { getAllProjects, getProject, createProject, updateProject, deleteProject } from '../db/queries.js';

const app = new Hono();

/** GET /projects — list all projects */
app.get('/', (c) => {
  const projects = getAllProjects();
  return c.json(projects);
});

/** GET /projects/:id — get a single project */
app.get('/:id', (c) => {
  const project = getProject(c.req.param('id'));
  if (!project) return c.json({ error: 'Project not found' }, 404);
  return c.json(project);
});

/** POST /projects — create a new project */
app.post('/', async (c) => {
  const { name, instructions } = await c.req.json<{
    name: string;
    instructions?: string;
  }>();

  if (!name?.trim()) {
    return c.json({ error: 'Project name is required' }, 400);
  }

  const project = createProject(name.trim(), instructions?.trim() || '');
  return c.json(project, 201);
});

/** PATCH /projects/:id — update a project */
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json<{
    name?: string;
    instructions?: string;
  }>();

  const project = updateProject(id, updates);
  if (!project) return c.json({ error: 'Project not found' }, 404);
  return c.json(project);
});

/** DELETE /projects/:id — delete a project (unlinks channels, doesn't delete them) */
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const deleted = deleteProject(id);
  if (!deleted) return c.json({ error: 'Project not found' }, 404);
  return c.json({ success: true });
});

export const projectRoutes = app;
