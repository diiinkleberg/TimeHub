# GitHub Webhook Auto-Deploy Setup

## Prerequisites

Your files are already in place:
- `/var/www/TimeHub/deploy.sh` - deployment script
- `/root/hooks.json` - webhook configuration

## Step 1: Install webhook package

```bash
# Install webhook
apt update
apt install -y webhook

# Verify installation
webhook -version
```

## Step 2: Test webhook manually

```bash
# Test run (Ctrl+C to stop)
webhook -hooks /root/hooks.json -verbose
```

This should show:
```
[webhook] 2025/11/15 13:10:00 serving hooks on http://0.0.0.0:9000/hooks/{id}
```

## Step 3: Run webhook with PM2 (persistent)

```bash
# Start webhook with PM2
pm2 start webhook --name github-webhook -- -hooks /root/hooks.json -verbose

# Save PM2 process list
pm2 save

# Enable PM2 startup (if not done already)
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 list
```

You should see both:
- `timehub` - your app
- `github-webhook` - webhook listener

## Step 4: Expose webhook via Tailscale Funnel

```bash
# Stop existing funnel if running
tailscale funnel --bg off

# Start funnel for both ports
tailscale serve / http://127.0.0.1:3000
tailscale serve /hooks/ http://127.0.0.1:9000

# Enable HTTPS funnel
tailscale funnel 443 on
```

Your webhook URL will be:
```
https://ubuntu-4gb-nbg1-1.at-boga.ts.net/hooks/deploy-timehub
```

## Step 5: Configure GitHub webhook

1. Go to your repo: https://github.com/diiinkleberg/TimeHub/settings/hooks
2. Click "Add webhook"
3. Set:
   - **Payload URL**: `https://ubuntu-4gb-nbg1-1.at-boga.ts.net/hooks/deploy-timehub`
   - **Content type**: `application/json`
   - **Secret**: `a85d1121ddb000c6517558105f8b89aecd0f0befc45ce1687e355c1c2f9a3d70`
   - **Events**: Just the push event
4. Click "Add webhook"

## Step 6: Make deploy.sh executable

```bash
chmod +x /var/www/TimeHub/deploy.sh
```

## Step 7: Test it!

```bash
# Watch logs
pm2 logs github-webhook

# Make a commit and push to GitHub
# You should see the webhook trigger and deploy.sh run
```

## Useful Commands

```bash
# View webhook logs
pm2 logs github-webhook

# View app logs
pm2 logs timehub

# Restart webhook
pm2 restart github-webhook

# Stop webhook
pm2 stop github-webhook

# List all PM2 processes
pm2 list

# Check PM2 startup status
pm2 show github-webhook
```

## Troubleshooting

### Webhook not triggering?

```bash
# Check if webhook is running
pm2 list

# Check logs
pm2 logs github-webhook --lines 50

# Test manually with curl
curl -X POST https://ubuntu-4gb-nbg1-1.at-boga.ts.net/hooks/deploy-timehub
```

### deploy.sh fails?

```bash
# Run manually to see errors
/var/www/TimeHub/deploy.sh

# Check permissions
ls -la /var/www/TimeHub/deploy.sh
```

### After server reboot, webhook doesn't start?

```bash
# Make sure PM2 startup is configured
pm2 startup

# Save current processes
pm2 save

# Reboot and test
sudo reboot
```

## Architecture

```
GitHub Push
    ↓
Webhook POST → https://your-tailscale-url/hooks/deploy-timehub
    ↓
Tailscale Funnel → Port 9000 (webhook listener)
    ↓
webhook package validates signature
    ↓
Executes /var/www/TimeHub/deploy.sh
    ↓
  - git pull
  - pnpm install
  - pnpm db:generate
  - pnpm build
  - pm2 restart timehub
    ↓
✅ New code deployed!
```