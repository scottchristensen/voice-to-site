export const metadata = {
  title: 'Voice Site Builder',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          /* Remove focus outline for mouse clicks, keep for keyboard */
          button:focus:not(:focus-visible),
          input:focus:not(:focus-visible),
          select:focus:not(:focus-visible),
          textarea:focus:not(:focus-visible),
          a:focus:not(:focus-visible) {
            outline: none;
          }
          /* Style for keyboard focus */
          :focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
