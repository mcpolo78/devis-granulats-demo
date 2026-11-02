// Développement : API Express sur :3001 ; lancer `npx vite` à côté (le proxy /api pointe ici).
import app from '../server/app.js';
const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`API sur http://localhost:${port}`));
