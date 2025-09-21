import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, attempts = 3, base = 400): Promise<T> {
	let lastErr: unknown;
	for (let i = 0; i < attempts; i++) {
		try { return await fn(); } catch (err) {
			lastErr = err;
			await new Promise(r => setTimeout(r, base * 2 ** i));
		}
	}
	throw lastErr;
}
