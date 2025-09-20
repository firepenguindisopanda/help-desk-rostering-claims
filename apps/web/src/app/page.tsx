"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
// removed: UI imports no longer needed for redirect-only page
import { routes } from "@/lib/routes";

export default function Home() {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;
		if (!user) {
			router.replace(routes.auth.login);
			return;
		}
		// Redirect based on user role
		if (user.role === "admin") {
			router.replace(routes.admin.index);
		} else if (user.role === "assistant") {
			router.replace(routes.assist.index);
		}
	}, [user, loading, router]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	// This route always redirects based on auth; show a tiny spinner
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="animate-spin rounded-full h-12 w-12 border-2 border-b-transparent" />
		</div>
	);
}
