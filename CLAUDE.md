## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel
- Production URL: https://vendorflow-hub-ochre.vercel.app
- Deploy workflow: auto-deploy on push (CLI: `vercel --prod --yes`)
- Deploy status command: `vercel ls`
- Merge method: squash
- Project type: web app (Vite + React + Supabase)
- GitHub repo: https://github.com/San20506/vendorflow-hub
- Post-deploy health check: https://vendorflow-hub-ochre.vercel.app

### Custom deploy hooks
- Pre-merge: `npm run build`
- Deploy trigger: `vercel --prod --yes`
- Deploy status: `vercel ls`
- Health check: https://vendorflow-hub-ochre.vercel.app

### Supabase
- Project ID: tssggzvmlpguzdelnwjc
- URL: https://tssggzvmlpguzdelnwjc.supabase.co
- Dashboard: https://supabase.com/dashboard/project/tssggzvmlpguzdelnwjc
- Region: Northeast Asia (Seoul)
