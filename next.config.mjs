/** @type {import('next').NextConfig} */
const nextConfig = {
  // pptxgenjs はサーバーサイド専用の Node API (fs 等) を使うため、
  // クライアントバンドルには含めずサーバー実行時のみ読み込む。
  serverExternalPackages: ["pptxgenjs", "pdf-parse"],
};

export default nextConfig;
