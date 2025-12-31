# Lumina Chat

A production-ready real-time chat application built on Cloudflare Workers with Durable Objects for stateful entities (Users, ChatBoards, Messages). Features a modern React frontend with shadcn/ui, Tailwind CSS, TanStack Query, and full CRUD operations via a type-safe API.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MacAntho/lumina-intelligent-legacy-journaling-platform)

## Key Features

- **Durable Objects for Entities**: One DO per User/ChatBoard with efficient indexing for listings.
- **Real-time Chat**: Messages stored per ChatBoard with atomic mutations.
- **Type-safe API**: Shared types between frontend and worker; Hono-based routing.
- **Modern UI**: shadcn/ui components, Tailwind, dark mode, responsive design.
- **Production-ready**: Error handling, CORS, logging, client error reporting.
- **Mock Data Seeding**: Pre-populated users/chats for instant demo.
- **Optimistic Updates**: TanStack Query integration ready.
- **Sidebar Layout**: Optional collapsible sidebar with navigation.

## Tech Stack

- **Backend**: Cloudflare Workers, Durable Objects, Hono, TypeScript
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router, Zustand, Framer Motion
- **Utilities**: Bun, Immer, Zod, Lucide Icons, Sonner (toasts)
- **DevOps**: Wrangler, Cloudflare Pages integration

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Cloudflare CLI (Wrangler)](https://developers.cloudflare.com/workers/wrangler/install-update/) installed and authenticated (`wrangler login`)

### Installation

```bash
bun install
```

### Development

Start the development server (frontend + worker proxy):

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) (or configured PORT).

- API endpoints available at `/api/*`
- Hot reload for both frontend and worker code
- Seed data auto-loads on first API call

### Build for Production

```bash
bun build
```

Outputs static assets to `dist/` for deployment.

## Usage

### API Endpoints

All responses follow `{ success: boolean; data?: T; error?: string }`.

- `GET /api/users` - List users (supports `?cursor` & `?limit`)
- `POST /api/users` - Create user `{ name: string }`
- `GET /api/chats` - List chats
- `POST /api/chats` - Create chat `{ title: string }`
- `GET /api/chats/:chatId/messages` - List messages
- `POST /api/chats/:chatId/messages` - Send message `{ userId: string; text: string }`
- `DELETE /api/users/:id`, `POST /api/users/deleteMany { ids: string[] }`
- `DELETE /api/chats/:id`, `POST /api/chats/deleteMany { ids: string[] }`

Frontend uses `api-client.ts` for type-safe fetches.

### Customizing

- **Add Entities**: Extend `IndexedEntity` in `worker/entities.ts`, add routes in `worker/user-routes.ts`
- **UI Components**: Edit `src/pages/`, use shadcn components via `components.json`
- **Worker Routes**: Add to `user-routes.ts` (auto-loaded by `index.ts`)
- **Styles**: `tailwind.config.js` & `src/index.css`
- **Seed Data**: Update `shared/mock-data.ts`

## Deployment

Deploy to Cloudflare Workers with Pages integration:

```bash
bun run deploy
```

Or manually:

1. `bun build`
2. `wrangler deploy`

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MacAntho/lumina-intelligent-legacy-journaling-platform)

**Configuration**: Edit `wrangler.jsonc` for custom bindings/migrations.

### Custom Domain

```bash
wrangler pages deploy dist --project-name=your-pages-project
wrangler pages domain add yourdomain.com --project-name=your-pages-project
```

## Project Structure

```
├── src/                 # React frontend
├── worker/              # Cloudflare Worker (API + DO logic)
├── shared/              # Shared types/mock data
└── ...                  # Configs (Vite, Tailwind, Wrangler)
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start dev server |
| `bun build` | Build frontend |
| `bun lint` | Lint code |
| `bun preview` | Preview production build |
| `bun deploy` | Build + deploy to Workers |
| `wrangler types` | Generate env types |

## Contributing

1. Fork & clone
2. `bun install`
3. `bun dev`
4. Submit PR

## License

MIT. See [LICENSE](LICENSE) for details.