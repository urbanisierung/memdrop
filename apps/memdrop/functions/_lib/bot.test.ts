import { describe, expect, it } from 'vitest'
import { isBot } from './bot.js'

describe('isBot', () => {
	it('detects Twitterbot', () => expect(isBot('Twitterbot/1.0')).toBe(true))
	it('detects Discordbot', () => expect(isBot('Discordbot/2.0')).toBe(true))
	it('detects Slackbot', () =>
		expect(isBot('Slackbot-LinkExpanding 1.0')).toBe(true))
	it('detects TelegramBot', () =>
		expect(isBot('TelegramBot (like TwitterBot)')).toBe(true))
	it('detects LinkedInBot', () => expect(isBot('LinkedInBot/1.0')).toBe(true))
	it('detects facebookexternalhit', () =>
		expect(isBot('facebookexternalhit/1.1')).toBe(true))
	it('detects Googlebot', () => expect(isBot('Googlebot/2.1')).toBe(true))
	it('detects WhatsApp', () => expect(isBot('WhatsApp/2.22.1')).toBe(true))
	it('ignores regular Chrome', () =>
		expect(isBot('Mozilla/5.0 Chrome/120.0.0.0')).toBe(false))
	it('ignores Safari', () =>
		expect(isBot('Mozilla/5.0 AppleWebKit/537.36 Safari/537.36')).toBe(false))
	it('handles empty string', () => expect(isBot('')).toBe(false))
})
