/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
  },
  async redirects() {
    // Both of these now live as sections inside the landing narrative.
    // Redirecting keeps old links and shared URLs working, and avoids
    // publishing the same content at two addresses.
    return [
      { source: "/formulas", destination: "/#formulas", permanent: true },
      { source: "/proceso", destination: "/#proceso", permanent: true },
    ];
  },
};

export default nextConfig;
