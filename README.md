# Quality Buddy

A small full-stack webapp for rotating your team into a peer "Quality Buddy" each
sprint. Node + Express + SQLite backend, React (Vite) frontend. No auth, designed
to be accessed on the local network.

## Rotation algorithm

Team members have a stable order. Each sprint stores a `rotation_offset`:

- First sprint: offset = 1
- Each subsequent sprint: offset = (prev_offset + 1) mod N
  - if the result is 0, bump it to 1 (no self-assignment)
- For member at index `i`, their buddy is at `(i + offset) mod N`

Because the offset changes every sprint (and never equals 0), no member ever gets
the same buddy two sprints in a row. For N=3 the offset alternates 1 → 2 → 1 → 2;
for N≥4 it cycles through N-1 unique configurations before repeating.

## Quick start (dev mode)

```bash
npm install
npm run dev
```

This starts:

- **API** on `http://0.0.0.0:3001` (binds all interfaces — accessible on the LAN)
- **Frontend dev server** on `http://0.0.0.0:5173` with `/api` proxied to the backend

Open `http://<your-machine-ip>:5173` from any device on the same network.

## Quick start (production)

```bash
npm install
npm run build        # builds the React app into frontend/dist/
npm start            # serves the API + static frontend on port 3001
```

Open `http://<your-machine-ip>:3001`.

## Quick start (Docker)

The included `Dockerfile` and `docker-compose.yml` build a single image that
serves the API and the built frontend on port 3001. Data persists in a named
volume.

```bash
docker compose up -d --build
docker compose logs -f
```

Open `http://<your-machine-ip>:3001` from any device on the same network.
The container is `restart: unless-stopped`, so it comes back automatically
after a host reboot.

Useful commands:

```bash
docker compose ps        # status
docker compose down      # stop (keeps the volume)
docker compose down -v   # stop and DELETE the database
docker compose exec app node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>console.log(r.status))"
docker compose restart   # restart after editing the compose file
```

To back up the database:

```bash
docker run --rm -v quality-buddy-data:/data -v $(pwd):/backup alpine \
  cp /data/quality-buddy.db /backup/quality-buddy-$(date +%F).db
```

### Customizing the deploy

Copy `.env.example` to `.env` and edit any value to override the compose defaults
(currently `HOST_PORT` and `TZ`). The DB file lives inside the `quality-buddy-data`
named volume; to mount a host directory instead, replace the named volume with a
bind mount:

```yaml
volumes:
  - ./data:/app/data
```

## Environment variables

| Variable     | Default                            | Description                  |
|--------------|------------------------------------|------------------------------|
| `PORT`       | `3001`                             | Backend listen port          |
| `HOST`       | `0.0.0.0`                          | Backend bind address         |
| `QB_DB_PATH` | `backend/data/quality-buddy.db`    | SQLite database file path    |

## Usage

1. **Add teammates** in the Team panel. Use ↑/↓ to set the order used by the
   rotation algorithm.
2. **Generate a sprint** on planning day. Set a name (e.g. `Sprint 7`) and the
   start/end dates. The app assigns each teammate a Quality Buddy.
3. **Copy for Slack** — click the button next to the sprint to put a formatted
   plaintext version on your clipboard, ready to paste into the team channel.
4. **Past sprints** stay in the history accordion. Expand any of them to view
   or copy those assignments.

## API

| Method | Path                       | Body / query                       | Returns                |
|--------|----------------------------|------------------------------------|------------------------|
| GET    | `/api/health`              |                                    | `{ok: true}`           |
| GET    | `/api/members`             |                                    | Member[]               |
| POST   | `/api/members`             | `{name}`                           | Created Member         |
| DELETE | `/api/members/:id`         |                                    | 204 / 409 if has history |
| PATCH  | `/api/members/reorder`     | `{ordered_ids: [3, 1, 2]}`         | Member[]               |
| GET    | `/api/sprints`             |                                    | Sprint[]               |
| GET    | `/api/sprints/current`     |                                    | Sprint with assignments |
| GET    | `/api/sprints/:id`         |                                    | Sprint with assignments |
| POST   | `/api/sprints`             | `{name, start_date, end_date}`     | Created sprint         |
| DELETE | `/api/sprints/:id`         |                                    | 204                    |
| GET    | `/api/sprints/:id/slack`   |                                    | Plaintext Slack format |

Dates are `YYYY-MM-DD`. Sprint names are unique.

## Tests

```bash
npm test
```

14 tests cover the rotation algorithm, the API surface, and an end-to-end
sprint creation workflow. The integration test uses a temporary SQLite file
so it never touches your dev data.

## Project layout

```
quality-buddy/
├── package.json                 (root, npm workspaces)
├── backend/
│   ├── data/quality-buddy.db    (auto-created, gitignored)
│   └── src/
│       ├── server.js            (Express entry)
│       ├── rotation.js          (pure algorithm)
│       ├── db/{init.js,schema.sql}
│       ├── routes/{members.js, sprints.js}
│       └── tests/               (node:test)
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js               (fetch wrapper)
        ├── format.js            (date + slack formatting)
        ├── styles.css
        └── components/          (TeamManager, NewSprintForm, etc.)
```

## Notes

- **No auth.** Anyone on the network can access the app and modify the data.
  Run it on a trusted network, or put it behind a reverse proxy with auth.
- **Manual sprint deletion** is the only "undo". There's no manual override of
  a specific buddy assignment — if you want a different pairing, delete the
  sprint and re-generate (or change member order first).
- **Backup:** `backend/data/quality-buddy.db` is the entire dataset. Copy that
  file to back up; restore by placing it back and starting the server.
