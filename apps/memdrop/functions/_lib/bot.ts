export function isBot(ua: string): boolean {
	return /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|linkedinbot|discordbot|slack/i.test(
		ua,
	)
}
