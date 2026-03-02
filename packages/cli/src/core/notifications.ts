/**
 * Webhook / notification system.
 *
 * Supports:
 *   - Slack  (incoming webhooks)
 *   - Discord (incoming webhooks)
 *   - Generic HTTP POST
 *
 * Configuration comes from prismaflow.config.ts webhooks array or from
 * environment variables (SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL).
 */
import { logger } from '../logger.js'
import type { WebhookConfig, WebhookEvent } from '@prisma-flow/shared'

export interface NotificationPayload {
  event:   WebhookEvent
  message: string
  detail?: Record<string, unknown>
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function buildSlackBody(payload: NotificationPayload): string {
  const emoji = payload.event === 'migration-failed' ? ':red_circle:' : ':warning:'
  return JSON.stringify({
    text: `${emoji} *PrismaFlow* — ${payload.message}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *PrismaFlow* — ${payload.message}`,
        },
      },
    ],
  })
}

function buildDiscordBody(payload: NotificationPayload): string {
  const emoji = payload.event === 'migration-failed' ? '🔴' : '⚠️'
  return JSON.stringify({
    content:  `${emoji} **PrismaFlow** — ${payload.message}`,
    username: 'PrismaFlow',
  })
}

function buildHttpBody(payload: NotificationPayload): string {
  return JSON.stringify({
    source:    'prismaflow',
    event:     payload.event,
    message:   payload.message,
    detail:    payload.detail ?? {},
    timestamp: new Date().toISOString(),
  })
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

async function deliverWebhook(
  config:  WebhookConfig,
  payload: NotificationPayload,
): Promise<void> {
  let body: string
  if (config.type === 'slack')   body = buildSlackBody(payload)
  else if (config.type === 'discord') body = buildDiscordBody(payload)
  else body = buildHttpBody(payload)

  const res = await fetch(config.url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal:  AbortSignal.timeout(8_000),
  })

  if (!res.ok) {
    throw new Error(`Webhook ${config.type} returned HTTP ${res.status}`)
  }
}

/**
 * Send a notification to all configured webhooks that subscribe to the given
 * event type. Never throws — errors are logged and swallowed.
 */
export async function notify(
  webhooks: WebhookConfig[],
  payload:  NotificationPayload,
): Promise<void> {
  const targets = webhooks.filter((w) => {
    if (!w.events || w.events.length === 0) return true
    return w.events.includes(payload.event)
  })

  if (targets.length === 0) return

  await Promise.allSettled(
    targets.map(async (webhook) => {
      try {
        await deliverWebhook(webhook, payload)
        logger.debug({ type: webhook.type, event: payload.event }, 'Webhook delivered')
      } catch (err) {
        logger.warn(
          { err, type: webhook.type, url: webhook.url.slice(0, 40) + '…' },
          'Webhook delivery failed (non-fatal)',
        )
      }
    }),
  )
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function buildWebhooksFromEnv(): WebhookConfig[] {
  const webhooks: WebhookConfig[] = []
  if (process.env['SLACK_WEBHOOK_URL']) {
    webhooks.push({ type: 'slack', url: process.env['SLACK_WEBHOOK_URL'] })
  }
  if (process.env['DISCORD_WEBHOOK_URL']) {
    webhooks.push({ type: 'discord', url: process.env['DISCORD_WEBHOOK_URL'] })
  }
  return webhooks
}
