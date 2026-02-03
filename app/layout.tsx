export const metadata = {
  title: 'Shopee - 2.2 1ª Liquidação do Ano',
  description: 'Gummy Original - Night Suplemento para dormir em goma - Framboesa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="m-0 p-0">{children}</body>
    </html>
  )
}
