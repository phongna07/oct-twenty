export function getPersonalization(search: string) {
  // URLSearchParams decodes UTF-8 and spaces once; NFC also handles names typed
  // using separate Vietnamese accent marks.
  const name = new URLSearchParams(search).get('name')?.normalize('NFC').trim().replace(/\s+/gu, ' ') || null
  const recipient = name ?? 'bạn'
  return {
    name,
    dedication: `Dành riêng cho ${recipient}`.toLocaleUpperCase('vi-VN'),
    signature: `gửi ${recipient}, bằng cả trái tim`,
    finalCaption: name ? `Dành tặng ${name}, với tất cả yêu thương` : 'Dành tặng một nửa xinh đẹp của thế giới',
    wish: `Chúc ${recipient} luôn rạng rỡ, hạnh phúc`,
    title: `Gửi ${recipient} một bó yêu thương · 20/10`,
  }
}
