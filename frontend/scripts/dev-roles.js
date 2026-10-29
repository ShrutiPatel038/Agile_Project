// Starts one Vite dev server per role so each role can be logged in at the same time.
// Each port is a separate browser origin, so each keeps its own localStorage token.
//
//   npm run dev:roles                       → user :5173, station master :5174, super admin :5175
//   VITE_API_URL=http://localhost:5001 ...  → point all three at another backend
import { spawn } from 'child_process';

const roles = [
    { name: 'user', port: 5173, color: '\x1b[36m' },
    { name: 'master', port: 5174, color: '\x1b[33m' },
    { name: 'admin', port: 5175, color: '\x1b[35m' },
];
const reset = '\x1b[0m';

const children = roles.map(({ name, port, color }) => {
    const child = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
        shell: true,
        env: process.env,
    });
    const prefix = `${color}[${name}:${port}]${reset} `;
    const pipe = (stream, out) => stream.on('data', (chunk) => {
        chunk.toString().split(/\r?\n/).filter(Boolean).forEach((line) => out.write(prefix + line + '\n'));
    });
    pipe(child.stdout, process.stdout);
    pipe(child.stderr, process.stderr);
    child.on('exit', (code) => console.log(`${prefix}exited with code ${code}`));
    return child;
});

const stopAll = () => {
    children.forEach((child) => child.kill());
    process.exit();
};
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
