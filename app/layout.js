import "./globals.css";

export const metadata = {
  title: "社内パワポ自動生成",
  description: "社内テンプレート準拠のパワーポイント資料をテキストから自動生成します。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
