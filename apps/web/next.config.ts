import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	async rewrites() {
		return [
			{
				source: "/api/v2/:path*",
				destination: "http://localhost:8080/api/v2/:path*",
			},
				{
					source: "/api/:path*",
					destination: "http://localhost:8080/api/:path*",
				},
		];
	},
};

export default nextConfig;
