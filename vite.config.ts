import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function gitExportPlugin(): Plugin {
  return {
    name: 'git-export-plugin',
    configureServer(server) {
      // 1. GET /api/git/info
      server.middlewares.use('/api/git/info', async (req, res) => {
        try {
          const { stdout } = await execAsync('git config --get remote.origin.url');
          const remoteUrl = stdout.trim();
          let owner = '';
          let repo = '';
          const match = remoteUrl.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
          if (match) {
            owner = match[1];
            repo = match[2];
          }
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ remoteUrl, owner, repo }));
        } catch {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ remoteUrl: '', owner: '', repo: '' }));
        }
      });

      // 2. POST /api/git/export
      server.middlewares.use('/api/git/export', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);
            const branch = payload.branchName || 'docs/repotale-guide';
            const projectRoot = process.cwd();

            // Write static HTML into /docs/index.html
            if (payload.staticHtmlContent) {
              const docsDir = path.join(projectRoot, 'docs');
              if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
              fs.writeFileSync(path.join(docsDir, 'index.html'), payload.staticHtmlContent, 'utf8');
            }

            // Write REPOTALE.md and update README.md
            if (payload.markdownContent) {
              fs.writeFileSync(path.join(projectRoot, 'REPOTALE.md'), payload.markdownContent, 'utf8');
              if (payload.updateReadme) {
                const readmePath = path.join(projectRoot, 'README.md');
                let current = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
                if (!current.includes('RepoTale Interactive Guide')) {
                  current = `${current.trimEnd()}\n\n---\n\n${payload.markdownContent}\n`;
                  fs.writeFileSync(readmePath, current, 'utf8');
                }
              }
            }

            // Execute git branch & commit
            let pushedToRemote = false;
            let gitError = '';

            try {
              await execAsync(`git checkout -B ${branch}`);
              await execAsync(`git add README.md REPOTALE.md docs/index.html`);
              await execAsync(`git commit -m "docs: add RepoTale interactive walkthrough guide and static viewer"`);
            } catch (commitErr: any) {
              console.warn('Git commit note:', commitErr?.message);
            }

            if (payload.pushToRemote) {
              try {
                await execAsync(`git push -u origin ${branch}`);
                pushedToRemote = true;
              } catch (pushErr: any) {
                console.warn('Git push note:', pushErr?.message);
                gitError = pushErr?.message || 'Git push failed';
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              branchName: branch,
              pushedToRemote,
              gitError: gitError || undefined,
            }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || 'Export error' }));
          }
        });
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), gitExportPlugin()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
      },
    },
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },
  envPrefix: ['VITE_', 'TAURI_']
});
